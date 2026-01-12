'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Photo, Selection } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Icons } from './Icons'

interface PhotoLightboxProps {
  photos: Photo[]
  currentIndex: number
  selections: Map<string, Selection>
  onClose: () => void
  onToggleSelection: (photo: Photo, comment?: string | null) => void
  onUpdateComment: (photo: Photo, comment: string) => void
  isLocked: boolean
}

export default function PhotoLightbox({
  photos,
  currentIndex,
  selections,
  onClose,
  onToggleSelection,
  onUpdateComment,
  isLocked,
}: PhotoLightboxProps) {
  const supabase = createClient()
  const [index, setIndex] = useState(currentIndex)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  // Touch handling refs
  const touchStart = useRef<number | null>(null)
  const touchEnd = useRef<number | null>(null)
  const minSwipeDistance = 50

  const currentPhoto = photos[index]
  const currentSelection = selections.get(currentPhoto.id)
  const isSelected = !!currentSelection
  const comment = currentSelection?.comment || ''

  useEffect(() => {
    setCommentText(currentSelection?.comment || '')
  }, [currentSelection])

  const handleNext = useCallback(() => {
    if (index < photos.length - 1) {
      setIndex(index + 1)
      setShowCommentInput(false)
    } else {
      setIndex(0) // Loop to start
    }
  }, [index, photos.length])

  const handlePrevious = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1)
      setShowCommentInput(false)
    } else {
      setIndex(photos.length - 1) // Loop to end
    }
  }, [index, photos.length])

  // Animated navigation functions
  const triggerNext = useCallback(() => {
    setAnimationClass('slide-out-left')
    setTimeout(() => {
      handleNext()
      setAnimationClass('slide-in-right')
    }, 150)
  }, [handleNext])

  const triggerPrev = useCallback(() => {
    setAnimationClass('slide-out-right')
    setTimeout(() => {
      handlePrevious()
      setAnimationClass('slide-in-left')
    }, 150)
  }, [handlePrevious])

  const handleToggleSelection = useCallback(() => {
    if (isLocked) return
    onToggleSelection(currentPhoto)
  }, [isLocked, onToggleSelection, currentPhoto])

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null
    touchStart.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return
    const distance = touchStart.current - touchEnd.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      triggerNext()
    } else if (isRightSwipe) {
      triggerPrev()
    }
  }

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showCommentInput) return

    switch (e.key) {
      case 'ArrowRight':
        triggerNext()
        break
      case 'ArrowLeft':
        triggerPrev()
        break
      case ' ':
        e.preventDefault()
        handleToggleSelection()
        break
      case 'Escape':
        onClose()
        break
    }
  }, [showCommentInput, triggerNext, triggerPrev, handleToggleSelection, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleUpdateComment = (newComment: string) => {
    if (isSelected) {
      onUpdateComment(currentPhoto, newComment)
    }
    setCommentText(newComment)
  }

  const getPhotoUrl = (photo: Photo) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 animate-fade-in touch-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide animation styles */}
      <style>{`
        .slide-out-left { transform: translateX(-30px); opacity: 0; transition: all 0.15s ease-in; }
        .slide-out-right { transform: translateX(30px); opacity: 0; transition: all 0.15s ease-in; }
        .slide-in-right { animation: slideInRight 0.3s ease-out; }
        .slide-in-left { animation: slideInLeft 0.3s ease-out; }
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Top Bar */}
      <div className="absolute top-0 w-full p-4 sm:p-6 flex justify-between items-center z-30 pointer-events-none">
        <div className="hidden sm:block bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 pointer-events-auto">
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
            {currentPhoto.original_filename}
          </span>
        </div>

        <button
          onClick={onClose}
          className="group flex items-center gap-3 bg-white/10 hover:bg-white text-white hover:text-stone-900 transition-all px-4 py-2 sm:px-5 rounded-full border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl ml-auto"
        >
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">Fermer</span>
          <div className="w-px h-3 sm:h-4 bg-current opacity-30"></div>
          <Icons.Close />
        </button>
      </div>

      {/* Interactive Main Area */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden pt-12 pb-32">
        {/* Large hover navigation areas - desktop */}
        <button
          onClick={triggerPrev}
          className="hidden sm:flex absolute inset-y-0 left-0 w-1/4 z-20 group items-center justify-start pl-8"
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/0 group-hover:bg-white/10 border border-transparent group-hover:border-white/20 text-white/0 group-hover:text-white transition-all duration-300">
            <Icons.ChevronLeftLarge />
          </div>
        </button>

        <button
          onClick={triggerNext}
          className="hidden sm:flex absolute inset-y-0 right-0 w-1/4 z-20 group items-center justify-end pr-8"
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/0 group-hover:bg-white/10 border border-transparent group-hover:border-white/20 text-white/0 group-hover:text-white transition-all duration-300">
            <Icons.ChevronRightLarge />
          </div>
        </button>

        {/* Main Image */}
        <div
          className={`relative max-w-[95vw] sm:max-w-[85vw] max-h-[60vh] sm:max-h-[75vh] z-10 ${animationClass}`}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          <img
            key={currentPhoto.id}
            src={getPhotoUrl(currentPhoto)}
            alt={currentPhoto.original_filename}
            className={`w-full h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-transform duration-500 pointer-events-none select-none ${isHoveringImage ? 'scale-[1.01]' : 'scale-100'}`}
          />
        </div>
      </div>

      {/* Interaction Bar */}
      <div className="absolute bottom-6 sm:bottom-12 z-30 flex flex-col items-center gap-4 sm:gap-6 w-full px-4">
        {/* Comment Drawer */}
        <div className={`transition-all duration-300 w-full max-w-lg overflow-hidden ${showCommentInput || comment ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-3 mb-2">
            <input
              type="text"
              placeholder="Ajouter une instruction ou un commentaire..."
              value={commentText}
              onChange={(e) => handleUpdateComment(e.target.value)}
              onFocus={() => setShowCommentInput(true)}
              onBlur={() => setShowCommentInput(false)}
              disabled={isLocked || !isSelected}
              className="w-full bg-transparent border-none text-white text-sm outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center gap-2 sm:gap-4 bg-stone-900/60 backdrop-blur-3xl p-2 sm:p-3 rounded-full border border-white/10 shadow-2xl w-full max-w-md sm:max-w-none justify-between sm:justify-center">
          {/* Previous Button */}
          <button
            onClick={triggerPrev}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/20 transition-all border border-white/5 active:scale-90"
          >
            <Icons.ChevronLeft />
          </button>

          {/* Selection Toggle Button */}
          {!isLocked && (
            <button
              onClick={handleToggleSelection}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-4 px-4 sm:px-12 h-12 sm:h-14 rounded-full font-bold text-sm sm:text-lg transition-all transform active:scale-95 shadow-xl border sm:min-w-[280px]
                ${isSelected
                  ? 'bg-rose-500 text-white border-rose-400 scale-105'
                  : 'bg-stone-800 text-white/70 border-white/5'
                }
              `}
            >
              <div className={`transition-all duration-300 ${isSelected ? 'text-white' : 'opacity-50'}`}>
                {isSelected ? <Icons.Heart /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
              </div>
              <span className="tracking-widest uppercase whitespace-nowrap text-xs sm:text-sm">
                {isSelected ? 'Photo choisie' : 'Choisir cette photo'}
              </span>
            </button>
          )}

          {/* Locked indicator */}
          {isLocked && (
            <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-4 px-4 sm:px-12 h-12 sm:h-14 rounded-full font-bold text-sm sm:text-lg bg-stone-800 text-white/50 border border-white/5 sm:min-w-[280px]">
              <Icons.Lock />
              <span className="tracking-widest uppercase whitespace-nowrap text-xs sm:text-sm">
                Selection verrouillée
              </span>
            </div>
          )}

          {/* Comment Toggle Button */}
          {!isLocked && isSelected && (
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full transition-all border active:scale-90 ${comment ? 'bg-white/20 text-white border-white/20' : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'}`}
              title="Ajouter un commentaire"
            >
              <Icons.Comment />
            </button>
          )}

          {/* Next Button */}
          <button
            onClick={triggerNext}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/20 transition-all border border-white/5 active:scale-90"
          >
            <Icons.ChevronRight />
          </button>
        </div>

        {/* Keyboard Shortcuts Hint - desktop only */}
        <div className="hidden sm:flex text-center text-white/30 text-xs gap-4">
          <span>← → Naviguer</span>
          <span>Espace: Sélectionner</span>
          <span>Échap: Fermer</span>
        </div>
      </div>
    </div>
  )
}
