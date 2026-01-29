'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Dossier, Photo, Selection } from '@/lib/types/database.types'
import PhotoGrid from './PhotoGrid'
import GalleryNavigation from './GalleryNavigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Icons } from './Icons'

interface LocalSelection {
  photo_id: string
  comment: string | null
}

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

  // Local selection state - not persisted until validation
  const [localSelections, setLocalSelections] = useState<Map<string, LocalSelection>>(
    new Map(initialSelections.map((s) => [s.photo_id, { photo_id: s.photo_id, comment: s.comment }]))
  )

  // Track initial state to compare for changes
  const [initialState] = useState<Map<string, LocalSelection>>(
    new Map(initialSelections.map((s) => [s.photo_id, { photo_id: s.photo_id, comment: s.comment }]))
  )

  const [submitting, setSubmitting] = useState(false)
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showLimitReached, setShowLimitReached] = useState(false)

  const isLocked = dossier.status === 'locked'
  const isAtLimit = localSelections.size >= dossier.photo_limit

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (localSelections.size !== initialState.size) return true
    for (const [photoId, selection] of localSelections) {
      const initial = initialState.get(photoId)
      if (!initial) return true
      if (selection.comment !== initial.comment) return true
    }
    return false
  }, [localSelections, initialState])

  const filteredPhotos = useMemo(() => {
    if (showOnlySelected) {
      return photos.filter((photo) => localSelections.has(photo.id))
    }
    return photos
  }, [photos, showOnlySelected, localSelections])

  // Convert local selections to Selection format for PhotoGrid
  const selectionsForGrid = useMemo(() => {
    const map = new Map<string, Selection>()
    for (const [photoId, local] of localSelections) {
      map.set(photoId, {
        id: photoId, // temporary ID
        dossier_id: dossier.id,
        photo_id: photoId,
        comment: local.comment,
        selected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    return map
  }, [localSelections, dossier.id])

  const handleToggleSelection = useCallback((
    photo: Photo,
    comment: string | null = null
  ) => {
    if (isLocked) return

    // Prevent unfavoriting when in favorites view
    if (showOnlySelected && localSelections.has(photo.id)) {
      return
    }

    setLocalSelections(prev => {
      const newSelections = new Map(prev)

      if (newSelections.has(photo.id)) {
        // Remove selection
        newSelections.delete(photo.id)
      } else {
        // Check if at limit before adding
        if (newSelections.size >= dossier.photo_limit) {
          setShowLimitReached(true)
          setTimeout(() => setShowLimitReached(false), 3000)
          return prev // Don't add, at limit
        }
        // Add selection
        newSelections.set(photo.id, { photo_id: photo.id, comment })
      }

      return newSelections
    })
  }, [isLocked, showOnlySelected, localSelections, dossier.photo_limit])

  const handleUpdateComment = useCallback((photo: Photo, comment: string) => {
    setLocalSelections(prev => {
      const existing = prev.get(photo.id)
      if (!existing) return prev

      const newSelections = new Map(prev)
      newSelections.set(photo.id, { ...existing, comment })
      return newSelections
    })
  }, [])

  const handleSubmit = async () => {
    if (isLocked) return

    setSubmitting(true)

    try {
      // First, delete all existing selections for this dossier
      await supabase
        .from('selections')
        .delete()
        .eq('dossier_id', dossier.id)

      // Then insert all current selections
      if (localSelections.size > 0) {
        const selectionsToInsert = Array.from(localSelections.values()).map(s => ({
          dossier_id: dossier.id,
          photo_id: s.photo_id,
          comment: s.comment,
        }))

        const { error: insertError } = await supabase
          .from('selections')
          .insert(selectionsToInsert)

        if (insertError) {
          console.error('Error inserting selections:', insertError)
          alert('Erreur lors de l\'enregistrement de la sélection')
          setSubmitting(false)
          return
        }
      }

      // Update dossier status
      const { error: updateError } = await supabase
        .from('dossiers')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', dossier.id)

      if (updateError) {
        console.error('Error updating dossier:', updateError)
      }

      // Send notification email if configured
      if (dossier.notification_email) {
        try {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dossierId: dossier.id,
              clientName: dossier.client_name,
              selectionCount: localSelections.size,
              notificationEmail: dossier.notification_email,
            }),
          })
        } catch (e) {
          console.error('Error sending notification:', e)
        }
      }

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        router.refresh()
      }, 4000)
    } catch (error) {
      console.error('Error submitting selections:', error)
      alert('Erreur lors de l\'envoi de la sélection')
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32">
      <GalleryNavigation
        selectedCount={localSelections.size}
        targetCount={dossier.photo_limit}
        clientName={dossier.client_name}
        onSend={handleSubmit}
        showOnlySelected={showOnlySelected}
        onToggleFilter={() => setShowOnlySelected(!showOnlySelected)}
        isLocked={isLocked}
        submitting={submitting}
        isAtLimit={isAtLimit}
      />

      {/* Limit reached notification */}
      {showLimitReached && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce-in">
          <span className="font-semibold">Limite atteinte ! Maximum {dossier.photo_limit} photos</span>
        </div>
      )}

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

      {/* Warning when viewing only selected - can't unfavorite */}
      {showOnlySelected && !isLocked && (
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm text-amber-800 text-center">
              Mode favoris : appuyez sur une photo pour l'agrandir. Revenez à la vue complète pour modifier votre sélection.
            </p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <main className="max-w-screen-2xl mx-auto px-6 py-12 lg:px-12">
        {filteredPhotos.length > 0 ? (
          <PhotoGrid
            photos={filteredPhotos}
            selections={selectionsForGrid}
            onToggleSelection={handleToggleSelection}
            onUpdateComment={handleUpdateComment}
            isLocked={isLocked}
            showOnlySelected={showOnlySelected}
            isAtLimit={isAtLimit}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-stone-400">
            <Icons.HeartOutline />
            <p className="text-xl font-serif italic mt-4">
              {showOnlySelected && localSelections.size === 0
                ? "Vous n'avez pas encore de photos sélectionnées."
                : "Aucune photo disponible."}
            </p>
            {showOnlySelected && localSelections.size === 0 && (
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

      {/* Success Overlay - Animated */}
      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 animate-fade-in">
          <div className="flex flex-col items-center text-white text-center px-6">
            {/* Animated checkmark */}
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
              <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl">
                <svg
                  className="w-16 h-16 text-green-500 animate-success-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" className="animate-draw-check"></polyline>
                </svg>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 animate-slide-up">
              Merci !
            </h2>
            <p className="text-xl md:text-2xl opacity-90 max-w-md animate-slide-up-delay">
              Votre sélection de {localSelections.size} photos a été envoyée au photographe avec succès.
            </p>

            {/* Decorative particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
