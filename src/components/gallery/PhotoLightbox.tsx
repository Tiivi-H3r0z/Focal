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

      {/* Top Bar: Minimal and floating */}
      <div className="absolute top-0 w-full p-4 sm:p-6 flex justify-between items-center z-30 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 pointer-events-auto shadow-sm">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-white/60 uppercase">
            {currentPhoto.original_filename}
          </span>
        </div>

        <button
          onClick={onClose}
          className="group flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-stone-900 transition-all px-3 py-2 sm:px-4 rounded-full border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl ml-auto"
        >
          <span className="text-[9px] sm:text-xs font-semibold tracking-widest uppercase">Fermer</span>
          <div className="w-px h-3 bg-current opacity-20"></div>
          <Icons.Close />
        </button>
      </div>

      {/* Main Image Area: Full bleed, respect aspect ratio */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Desktop Nav Arrows */}
        <button
          onClick={triggerPrev}
          className="hidden sm:flex absolute inset-y-0 left-0 w-1/6 z-20 group items-center justify-start pl-8"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/0 group-hover:bg-white/10 text-white/0 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </div>
        </button>

        <button
          onClick={triggerNext}
          className="hidden sm:flex absolute inset-y-0 right-0 w-1/6 z-20 group items-center justify-end pr-8"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/0 group-hover:bg-white/10 text-white/0 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </button>

        {/* Main Image */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-500 z-10 p-4 pb-24 sm:pb-32 ${animationClass}`}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          <img
            key={currentPhoto.id}
            src={getPhotoUrl(currentPhoto)}
            alt={currentPhoto.original_filename}
            className={`w-auto h-auto max-w-full max-h-full object-contain shadow-2xl transition-transform duration-500 pointer-events-none select-none ${isHoveringImage ? 'scale-[1.01]' : 'scale-100'}`}
          />
        </div>
      </div>

      {/* Interaction Bar: Bottom Docked & Discreet */}
      <div className="absolute bottom-4 sm:bottom-6 z-30 flex flex-col items-center gap-2 w-full px-4">
        {/* Comment Drawer: Semi-transparent overlay */}
        <div className={`transition-all duration-300 w-full max-w-lg overflow-hidden ${showCommentInput || comment ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-stone-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 mb-2">
            <input
              type="text"
              autoFocus={showCommentInput}
              placeholder="Note pour le photographe..."
              value={commentText}
              onChange={(e) => handleUpdateComment(e.target.value)}
              onFocus={() => setShowCommentInput(true)}
              onBlur={() => setShowCommentInput(false)}
              disabled={isLocked || !isSelected}
              className="w-full bg-transparent border-none text-white text-sm outline-none placeholder:text-white/40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* The Control Bar - Docked Aesthetic */}
        <div className="flex items-center gap-1 bg-stone-900/50 backdrop-blur-2xl p-1.5 rounded-full border border-white/5 shadow-2xl w-fit">
          {/* Previous Button */}
          <button
            onClick={triggerPrev}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          {/* Selection Toggle Button */}
          {!isLocked && (
            <button
              onClick={handleToggleSelection}
              className={`flex items-center justify-center gap-3 px-6 sm:px-10 h-10 sm:h-12 rounded-full font-semibold text-xs sm:text-sm transition-all transform active:scale-95 border
                ${isSelected
                  ? 'bg-white text-stone-900 border-white'
                  : 'bg-stone-800/80 text-white/90 border-white/10 hover:border-white/30'
                }
              `}
            >
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${isSelected ? 'bg-stone-900 border-stone-900' : 'border-white/40'}`} />
              <span className="tracking-[0.1em] uppercase whitespace-nowrap">
                {isSelected ? 'Photo choisie' : 'Choisir cette photo'}
              </span>
            </button>
          )}

          {/* Locked indicator */}
          {isLocked && (
            <div className="flex items-center justify-center gap-3 px-6 sm:px-10 h-10 sm:h-12 rounded-full font-semibold text-xs sm:text-sm bg-stone-800/80 text-white/50 border border-white/10">
              <Icons.Lock />
              <span className="tracking-[0.1em] uppercase whitespace-nowrap">
                Verrouillé
              </span>
            </div>
          )}

          {/* Comment Toggle Button */}
          {!isLocked && isSelected && (
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all active:scale-90 ${comment ? 'text-white bg-white/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              title="Ajouter un commentaire"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
          )}

          {/* Next Button */}
          <button
            onClick={triggerNext}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
