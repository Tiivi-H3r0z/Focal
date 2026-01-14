import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dossierId = params.id

  // Verify the dossier belongs to the user
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('id, photographer_id')
    .eq('id', dossierId)
    .single()

  if (dossierError || !dossier) {
    return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
  }

  if (dossier.photographer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all photos for this dossier
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('dossier_id', dossierId)

  if (photosError) {
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }

  // Delete all photos from storage
  if (photos && photos.length > 0) {
    const photosPaths = photos.map((photo) => photo.storage_path)
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove(photosPaths)

    if (storageError) {
      console.error('Error deleting photos from storage:', storageError)
      // Continue with deletion even if storage deletion fails
    }
  }

  // Delete the dossier (this will cascade delete photos and selections)
  const { error: deleteError } = await supabase
    .from('dossiers')
    .delete()
    .eq('id', dossierId)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete dossier' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
