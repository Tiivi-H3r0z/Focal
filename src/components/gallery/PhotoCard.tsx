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
      className={`masonry-item group relative overflow-hidden bg-stone-900 transition-all duration-500 cursor-pointer rounded-sm
        ${isSelected ? 'outline outline-2 outline-white' : 'hover:shadow-2xl hover:shadow-black/50'}
      `}
      onClick={handlePhotoClick}
    >
      <img
        src={getPhotoUrl()}
        alt={photo.original_filename}
        className={`w-full block h-auto transition-all duration-700 group-hover:scale-[1.02]
          ${isAtLimit && !isSelected ? 'grayscale opacity-40 contrast-75' : ''}
        `}
        loading="lazy"
      />

      {/* Overlay controls - desktop */}
      <div className="absolute inset-0 bg-black/10 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          {/* Selection indicator on desktop hover */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
              ${isSelected ? 'bg-white border-white text-stone-900' : 'bg-white/5 border-white/20'}
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
            {/* Heart button for selection on desktop - Hide if limit reached and not selected */}
            {(isSelected || !isAtLimit) && (
              <button
                onClick={handleToggle}
                disabled={!canToggle}
                className={`p-3 sm:p-2 rounded-full backdrop-blur-sm transition-all border-2
                  ${isSelected
                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : canToggle
                      ? 'bg-white/10 hover:bg-white/20 border-white text-white'
                      : 'bg-white/5 border-white/20 text-white/40 cursor-not-allowed'
                  }
                `}
              >
                <Icons.Heart solid={isSelected} />
              </button>
            )}
          </div>
        </div>
        <div className="text-white text-[10px] font-bold tracking-[0.2em] uppercase drop-shadow-md bg-black/40 px-2 py-1 rounded inline-block self-start">
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
        {/* Heart button for selection on mobile - Hide if limit reached and not selected */}
        {(isSelected || !isAtLimit) && (
          <button
            onClick={handleToggle}
            disabled={!canToggle}
            className={`p-3 rounded-full backdrop-blur-md transition-all border-2
              ${isSelected
                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30'
                : canToggle
                  ? 'bg-black/40 border-white text-white active:bg-white/20'
                  : 'bg-black/20 border-white/20 text-white/40'
              }
            `}
          >
            <Icons.Heart solid={isSelected} />
          </button>
        )}
      </div>



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
