'use client'

import type { Photo, Selection } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Icons } from './Icons'

interface PhotoCardProps {
  photo: Photo
  selection?: Selection
  onToggleSelection: (photo: Photo, comment?: string | null) => void
  onUpdateComment: (photo: Photo, comment: string) => void
  onPhotoClick: () => void
  isLocked: boolean
  showOnlySelected?: boolean
  isAtLimit?: boolean
}

export default function PhotoCard({
  photo,
  selection,
  onToggleSelection,
  onUpdateComment,
  onPhotoClick,
  isLocked,
  showOnlySelected = false,
  isAtLimit = false,
}: PhotoCardProps) {
  const supabase = createClient()
  const isSelected = !!selection
  const hasComment = !!selection?.comment

  // Can't toggle if locked, or if in favorites view and already selected, or at limit and not selected
  const canToggle = !isLocked && !(showOnlySelected && isSelected) && !(isAtLimit && !isSelected)

  const getPhotoUrl = () => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canToggle) return
    onToggleSelection(photo)
  }

  const handlePhotoClick = () => {
    // Tap on photo always opens lightbox
    onPhotoClick()
  }

  return (
    <div
      className={`masonry-item group relative overflow-hidden bg-stone-100 transition-all duration-500 cursor-pointer rounded-sm
        ${isSelected ? 'ring-4 ring-stone-900 ring-inset shadow-inner' : 'hover:shadow-xl'}
      `}
      onClick={handlePhotoClick}
    >
      <img
        src={getPhotoUrl()}
        alt={photo.original_filename}
        className={`w-full block h-auto transition-transform duration-700 group-hover:scale-[1.02] ${isSelected ? 'opacity-90' : ''}`}
        loading="lazy"
      />

      {/* Overlay controls - desktop */}
      <div className="absolute inset-0 bg-black/10 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          {/* Selection indicator on desktop hover */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
              ${isSelected ? 'bg-stone-900 border-stone-900' : 'bg-white/20 border-white'}
            `}
          >
            {isSelected && <Icons.Check />}
          </div>
          <div className="flex gap-2">
            {hasComment && (
              <div className="p-2 bg-stone-900/60 rounded-full text-white backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
            )}
            {/* Heart button for selection on desktop */}
            <button
              onClick={handleToggle}
              disabled={!canToggle}
              className={`p-3 sm:p-2 rounded-full backdrop-blur-sm transition-all
                ${isSelected
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : canToggle
                    ? 'bg-white/20 hover:bg-white/40 text-white'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }
              `}
            >
              <Icons.Heart />
            </button>
          </div>
        </div>
        <div className="text-white text-xs font-medium tracking-wider drop-shadow-md bg-black/20 p-1 rounded inline-block self-start">
          {photo.original_filename}
        </div>
      </div>

      {/* Persistent visible overlay on mobile - Heart button for selection */}
      <div className="sm:hidden absolute top-2 right-2 flex gap-2 items-center">
        {hasComment && (
          <div className="p-2 bg-stone-900/40 rounded-full text-white backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
        )}
        {/* Heart button for selection on mobile */}
        <button
          onClick={handleToggle}
          disabled={!canToggle}
          className={`p-3 rounded-full backdrop-blur-md transition-all
            ${isSelected
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : canToggle
                ? 'bg-black/40 text-white active:bg-white/60'
                : 'bg-black/20 text-white/40'
            }
          `}
        >
          <Icons.Heart />
        </button>
      </div>

      {/* Persistent selected indicator - top left */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white ring-2 ring-white shadow-lg animate-zoom-in">
          <Icons.Heart />
        </div>
      )}

      {/* Locked indicator */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/10 cursor-not-allowed" />
      )}

      {/* At limit indicator for non-selected photos */}
      {isAtLimit && !isSelected && !isLocked && (
        <div className="absolute inset-0 bg-black/5 cursor-default" />
      )}
    </div>
  )
}
