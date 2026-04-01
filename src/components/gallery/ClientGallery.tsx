'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Dossier, Photo, Selection } from '@/lib/types/database.types'
import PhotoGrid from './PhotoGrid'
import PhotoLightbox from './PhotoLightbox'
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
  const [showSubmittedBanner, setShowSubmittedBanner] = useState(true)

  const PAGE_SIZE = 50
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const chunks = useMemo(() => {
    const visiblePhotos = filteredPhotos.slice(0, visibleCount)
    const result = []
    for (let i = 0; i < visiblePhotos.length; i += PAGE_SIZE) {
      result.push(visiblePhotos.slice(i, i + PAGE_SIZE))
    }
    return result
  }, [filteredPhotos, visibleCount])

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
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <GalleryNavigation
        selectedCount={localSelections.size}
        targetCount={dossier.photo_limit}
        clientName={dossier.client_name}
        onSend={handleSubmit}
        showOnlySelected={showOnlySelected}
        onToggleFilter={() => {
          setShowOnlySelected(!showOnlySelected)
          setVisibleCount(PAGE_SIZE)
        }}
        isLocked={isLocked}
        submitting={submitting}
        isAtLimit={isAtLimit}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
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
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-white flex-shrink-0">
                <Icons.Lock />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-100">
                  Sélection verrouillée
                </h3>
                <p className="mt-1 text-stone-400">
                  Votre sélection a été reçue et est en cours de traitement. Vous pouvez consulter vos choix mais ne pouvez plus les modifier.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted status banner - fixed at top */}
      {dossier.status === 'submitted' && !isLocked && showSubmittedBanner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md bg-green-600 border border-green-500 shadow-[0_20px_50px_rgba(21,128,61,0.3)] rounded-2xl p-4 flex items-center gap-4 animate-bounce-in text-white">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 flex-shrink-0">
            <Icons.CheckCircle />
          </div>
          <div className="flex-1">
            <p className="font-bold leading-tight">
              Le photographe a reçu ta sélection
            </p>
            <p className="text-xs mt-0.5 font-medium text-green-100">
              Mais tu peux encore modifier tes choix avant qu'il ne valide
            </p>
          </div>
          <button
            onClick={() => setShowSubmittedBanner(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-green-100 hover:text-white"
          >
            <Icons.Close />
          </button>
        </div>
      )}

      {/* Warning when viewing only selected - can't unfavorite */}
      {showOnlySelected && !isLocked && (
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 mt-6">
          <div className="bg-amber-950/30 border border-amber-900/50 rounded-2xl p-4">
            <p className="text-sm text-amber-200/70 text-center">
              Mode favoris : appuyez sur une photo pour l'agrandir. Revenez à la vue complète pour modifier votre sélection.
            </p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <main className="max-w-screen-2xl mx-auto px-6 py-12 lg:px-12">
        {filteredPhotos.length > 0 ? (
          <>
            {chunks.map((chunk, chunkIndex) => (
              <div key={chunkIndex}>
                {chunkIndex > 0 && (
                  <div className="col-span-full my-24 flex items-center justify-center w-full relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/90"></div>
                    </div>
                    <div className="relative flex flex-col items-center justify-center bg-[#0a0a0a] px-8 text-center">
                      <span className="text-white font-serif text-2xl mb-1">
                        Photos
                      </span>
                      <span className="text-sm font-medium tracking-widest text-stone-300">
                        {chunkIndex * PAGE_SIZE} à {Math.min((chunkIndex + 1) * PAGE_SIZE, filteredPhotos.length)}
                      </span>
                    </div>
                  </div>
                )}
                <PhotoGrid
                  photos={chunk}
                  selections={selectionsForGrid}
                  onToggleSelection={handleToggleSelection}
                  onUpdateComment={handleUpdateComment}
                  isLocked={isLocked}
                  showOnlySelected={showOnlySelected}
                  isAtLimit={isAtLimit}
                  gridSize={gridSize}
                  onPhotoClick={setLightboxIndex}
                  startIndex={chunkIndex * PAGE_SIZE}
                />
              </div>
            ))}

            {visibleCount < filteredPhotos.length && (
              <div className="flex justify-center mt-12 mb-8">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="flex flex-row items-center gap-6 px-10 py-5 bg-white hover:bg-stone-200 text-stone-900 rounded-full transition-all hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.15)] group"
                >
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 group-hover:scale-110 transition-transform">
                    <Icons.Plus />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-lg leading-none mb-1">Photos suivantes</span>
                    <span className="text-sm font-medium text-stone-500 group-hover:text-stone-700">
                      {filteredPhotos.length - visibleCount} restantes
                    </span>
                  </div>
                </button>
              </div>
            )}
          </>
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

        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={filteredPhotos.slice(0, visibleCount)}
            currentIndex={lightboxIndex}
            selections={selectionsForGrid}
            onClose={() => setLightboxIndex(null)}
            onToggleSelection={handleToggleSelection}
            onUpdateComment={handleUpdateComment}
            isLocked={isLocked}
            showOnlySelected={showOnlySelected}
            isAtLimit={isAtLimit}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-900 mt-12 bg-[#0a0a0a]">
        <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-stone-600 text-sm font-medium tracking-widest">
          <p>POWERED BY FOCAL STUDIO</p>
          <p className="mt-4 md:mt-0 italic font-serif text-lg text-white">Les Augustins Photographie &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-[110px] sm:bottom-[130px] right-6 z-40 bg-white/10 hover:bg-white text-white hover:text-stone-900 border border-white/20 hover:border-white/50 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all animate-fade-in focus:outline-none"
        >
          <Icons.ArrowUp />
        </button>
      )}

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
