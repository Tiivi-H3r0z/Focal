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

  // Check if dossier is visible to clients
  if (!dossier.visible) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-stone-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">
            Galerie non disponible
          </h1>
          <p className="text-stone-600 mb-8">
            Cette galerie n'est pas encore accessible. Le photographe vous informera lorsqu'elle sera prête.
          </p>
          <p className="text-sm text-stone-400">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre photographe.
          </p>
        </div>
      </div>
    )
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
