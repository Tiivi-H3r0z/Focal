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

  // Verify the dossier belongs to the user
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('id, photographer_id, archived')
    .eq('id', dossierId)
    .single()

  if (dossierError || !dossier) {
    return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
  }

  if (dossier.photographer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if archived
  if (!dossier.archived) {
    return NextResponse.json(
      { error: 'Dossier is not archived' },
      { status: 400 }
    )
  }

  // Mark dossier as unarchived
  const { error: updateError } = await supabase
    .from('dossiers')
    .update({
      archived: false,
      archived_at: null,
    })
    .eq('id', dossierId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to unarchive dossier' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
