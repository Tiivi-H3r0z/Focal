'use client'

import { useState, useMemo } from 'react'
import type { Dossier, Photo, Selection } from '@/lib/types/database.types'
import PhotoGrid from './PhotoGrid'
import GalleryNavigation from './GalleryNavigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Icons } from './Icons'

interface ClientGalleryProps {
  dossier: Dossier
  photos: Photo[]
  initialSelections: Selection[]
}

export default function ClientGallery({
  dossier,
  photos,
  initialSelections,
}: ClientGalleryProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selections, setSelections] = useState<Map<string, Selection>>(
    new Map(initialSelections.map((s) => [s.photo_id, s]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const isLocked = dossier.status === 'locked'

  const filteredPhotos = useMemo(() => {
    if (showOnlySelected) {
      return photos.filter((photo) => selections.has(photo.id))
    }
    return photos
  }, [photos, showOnlySelected, selections])

  const handleToggleSelection = async (
    photo: Photo,
    comment: string | null = null
  ) => {
    if (isLocked) return

    const newSelections = new Map(selections)

    if (newSelections.has(photo.id)) {
      // Remove selection
      const selection = newSelections.get(photo.id)!
      await supabase.from('selections').delete().eq('id', selection.id)
      newSelections.delete(photo.id)
    } else {
      // Add selection
      const { data, error } = await supabase
        .from('selections')
        .insert({
          dossier_id: dossier.id,
          photo_id: photo.id,
          comment,
        })
        .select()
        .single()

      if (!error && data) {
        newSelections.set(photo.id, data)
      }
    }

    setSelections(newSelections)
  }

  const handleUpdateComment = async (photo: Photo, comment: string) => {
    const selection = selections.get(photo.id)
    if (!selection) return

    const { error } = await supabase
      .from('selections')
      .update({ comment })
      .eq('id', selection.id)

    if (!error) {
      const newSelections = new Map(selections)
      newSelections.set(photo.id, { ...selection, comment })
      setSelections(newSelections)
    }
  }

  const handleSubmit = async () => {
    if (isLocked) return

    if (
      !confirm(
        `Envoyer votre sélection de ${selections.size} photos ? Vous pourrez encore modifier votre sélection par la suite si nécessaire.`
      )
    ) {
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('dossiers')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', dossier.id)

    if (!error) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
      router.refresh()
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32">
      <GalleryNavigation
        selectedCount={selections.size}
        targetCount={dossier.photo_limit}
        tolerance={dossier.photo_limit_tolerance}
        clientName={dossier.client_name}
        onSend={handleSubmit}
        showOnlySelected={showOnlySelected}
        onToggleFilter={() => setShowOnlySelected(!showOnlySelected)}
        isLocked={isLocked}
        submitting={submitting}
      />

      {/* Status Messages */}
      {isLocked && (
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 mt-6">
          <div className="bg-stone-100 border border-stone-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-white flex-shrink-0">
                <Icons.Lock />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900">
                  Sélection verrouillée
                </h3>
                <p className="mt-1 text-stone-600">
                  Votre sélection a été reçue et est en cours de traitement. Vous pouvez consulter vos choix mais ne pouvez plus les modifier.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {dossier.status === 'submitted' && !isLocked && (
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                <Icons.CheckCircle />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Sélection envoyée
                </h3>
                <p className="mt-1 text-green-700">
                  Votre sélection a été envoyée ! Vous pouvez encore modifier vos choix jusqu'à ce que le photographe verrouille la sélection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <main className="max-w-screen-2xl mx-auto px-6 py-12 lg:px-12">
        {filteredPhotos.length > 0 ? (
          <PhotoGrid
            photos={filteredPhotos}
            selections={selections}
            onToggleSelection={handleToggleSelection}
            onUpdateComment={handleUpdateComment}
            isLocked={isLocked}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-stone-400">
            <Icons.HeartOutline />
            <p className="text-xl font-serif italic mt-4">
              {showOnlySelected && selections.size === 0
                ? "Vous n'avez pas encore de photos sélectionnées."
                : "Aucune photo disponible."}
            </p>
            {showOnlySelected && selections.size === 0 && (
              <button
                onClick={() => setShowOnlySelected(false)}
                className="mt-4 text-stone-900 font-bold underline underline-offset-4 hover:text-stone-700 transition-colors"
              >
                Voir toutes les photos
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-100 mt-12 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-stone-400 text-sm font-medium tracking-widest">
          <p>POWERED BY FOCAL STUDIO</p>
          <p className="mt-4 md:mt-0 italic font-serif text-lg text-stone-900">Les Augustins Photographie &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Submitting Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-serif text-stone-900">Envoi de votre sélection...</h2>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-slide-up">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-stone-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span className="font-semibold tracking-wide uppercase text-sm">Sélection envoyée avec succès !</span>
        </div>
      )}
    </div>
  )
}
