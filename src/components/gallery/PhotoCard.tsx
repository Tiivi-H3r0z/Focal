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
  aspectRatio?: 'portrait' | 'landscape' | 'square'
}

export default function PhotoCard({
  photo,
  selection,
  onToggleSelection,
  onUpdateComment,
  onPhotoClick,
  isLocked,
  aspectRatio = 'square',
}: PhotoCardProps) {
  const supabase = createClient()
  const isSelected = !!selection
  const hasComment = !!selection?.comment

  const getPhotoUrl = () => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLocked) return
    onToggleSelection(photo)
  }

  return (
    <div
      className={`group relative overflow-hidden bg-stone-200 transition-all duration-500 cursor-pointer
        ${aspectRatio === 'portrait' ? 'sm:row-span-2' : ''}
        ${aspectRatio === 'landscape' ? 'sm:col-span-2' : ''}
        ${isSelected ? 'ring-4 ring-stone-900 ring-inset' : 'hover:shadow-2xl'}
        aspect-[4/3] sm:aspect-auto
      `}
      onClick={handleToggle}
    >
      <img
        src={getPhotoUrl()}
        alt={photo.original_filename}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSelected ? 'opacity-80' : ''}`}
        loading="lazy"
      />

      {/* Overlay controls - desktop */}
      <div className="absolute inset-0 bg-black/20 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
              ${isSelected ? 'bg-stone-900 border-stone-900' : 'bg-white/20 border-white'}
            `}
          >
            {isSelected && <Icons.Check />}
          </div>
          <div className="flex gap-2">
            {hasComment && (
              <div className="p-2 bg-stone-900/50 rounded-full text-white backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPhotoClick()
              }}
              className="p-3 sm:p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </div>
        <div className="text-white text-xs font-medium tracking-wider drop-shadow-md">
          {photo.original_filename}
        </div>
      </div>

      {/* Persistent visible overlay on mobile */}
      <div className="sm:hidden absolute top-2 right-2 flex gap-2 items-center">
         {hasComment && (
            <div className="p-2 bg-stone-900/40 rounded-full text-white backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
          )}
         <button
            onClick={(e) => {
              e.stopPropagation()
              onPhotoClick()
            }}
            className="p-3 bg-black/40 rounded-full text-white backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
      </div>

      {/* Persistent selected indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white ring-2 ring-white shadow-lg animate-zoom-in">
          <Icons.Heart />
        </div>
      )}

      {/* Locked indicator */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/10 cursor-not-allowed" />
      )}
    </div>
  )
}
