import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
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

  // Verify the dossier belongs to the user and is locked
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('id, photographer_id, status, archived')
    .eq('id', dossierId)
    .single()

  if (dossierError || !dossier) {
    return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
  }

  if (dossier.photographer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if dossier is locked (finalized)
  if (dossier.status !== 'locked') {
    return NextResponse.json(
      { error: 'Dossier must be locked before archiving' },
      { status: 400 }
    )
  }

  // Check if already archived
  if (dossier.archived) {
    return NextResponse.json(
      { error: 'Dossier is already archived' },
      { status: 400 }
    )
  }

  // Get all selected photo IDs
  const { data: selections, error: selectionsError } = await supabase
    .from('selections')
    .select('photo_id')
    .eq('dossier_id', dossierId)

  if (selectionsError) {
    return NextResponse.json(
      { error: 'Failed to fetch selections' },
      { status: 500 }
    )
  }

  const selectedPhotoIds = selections?.map((s) => s.photo_id) || []

  // Get all photos that are NOT selected
  let query = supabase
    .from('photos')
    .select('id, storage_path')
    .eq('dossier_id', dossierId)

  if (selectedPhotoIds.length > 0) {
    query = query.not('id', 'in', `(${selectedPhotoIds.join(',')})`)
  }

  const { data: photosToDelete, error: photosError } = await query

  if (photosError) {
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }

  // Delete non-selected photos from storage
  if (photosToDelete && photosToDelete.length > 0) {
    const photosPaths = photosToDelete.map((photo) => photo.storage_path)
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove(photosPaths)

    if (storageError) {
      console.error('Error deleting photos from storage:', storageError)
      return NextResponse.json(
        { error: 'Failed to delete photos from storage' },
        { status: 500 }
      )
    }

    // Delete non-selected photos from database
    const photoIdsToDelete = photosToDelete.map((photo) => photo.id)
    const { error: deletePhotosError } = await supabase
      .from('photos')
      .delete()
      .in('id', photoIdsToDelete)

    if (deletePhotosError) {
      console.error('Error deleting photos from database:', deletePhotosError)
      return NextResponse.json(
        { error: 'Failed to delete photos from database' },
        { status: 500 }
      )
    }
  }

  // Mark dossier as archived
  const { error: updateError } = await supabase
    .from('dossiers')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', dossierId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to archive dossier' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    deletedPhotos: photosToDelete?.length || 0,
  })
}
