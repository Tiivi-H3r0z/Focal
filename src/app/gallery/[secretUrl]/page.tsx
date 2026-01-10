import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClientGallery from '@/components/gallery/ClientGallery'

export default async function GalleryPage({
  params,
}: {
  params: { secretUrl: string }
}) {
  const supabase = await createClient()

  // Fetch dossier by secret URL
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('secret_url', params.secretUrl)
    .single()

  if (dossierError || !dossier) {
    notFound()
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('dossier_id', dossier.id)
    .order('display_order', { ascending: true })

  // Fetch existing selections
  const { data: selections } = await supabase
    .from('selections')
    .select('*')
    .eq('dossier_id', dossier.id)

  return (
    <ClientGallery
      dossier={dossier}
      photos={photos || []}
      initialSelections={selections || []}
    />
  )
}
