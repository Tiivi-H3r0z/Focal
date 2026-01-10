'use client'

import type { Photo, Selection } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

interface PhotoCardProps {
  photo: Photo
  selection?: Selection
  onToggleSelection: (photo: Photo, comment?: string | null) => void
  onUpdateComment: (photo: Photo, comment: string) => void
  onPhotoClick: () => void
  isLocked: boolean
}

export default function PhotoCard({
  photo,
  selection,
  onToggleSelection,
  onUpdateComment,
  onPhotoClick,
  isLocked,
}: PhotoCardProps) {
  const supabase = createClient()
  const isSelected = !!selection

  const getPhotoUrl = () => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  const handleCheckboxChange = () => {
    if (isLocked) return
    onToggleSelection(photo)
  }

  return (
    <div
      className={`relative group rounded overflow-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-stone-900 shadow-xl'
          : 'hover:shadow-lg'
      }`}
    >
      {/* Photo */}
      <div
        className="aspect-square bg-stone-100 cursor-pointer"
        onClick={onPhotoClick}
      >
        <img
          src={getPhotoUrl()}
          alt={photo.original_filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Overlay with Controls */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity ${
          isLocked ? 'cursor-not-allowed' : ''
        }`}
      >
        {/* Checkbox */}
        {!isLocked && (
          <div className="absolute top-3 left-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-5 rounded border-2 border-white text-stone-900 focus:ring-stone-900 cursor-pointer shadow-sm"
            />
          </div>
        )}

        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-3 right-3 bg-stone-900 text-white px-3 py-1 rounded text-xs font-medium tracking-wide">
            SELECTED
          </div>
        )}

        {/* Comment Indicator */}
        {selection?.comment && (
          <div className="absolute bottom-3 left-3 bg-stone-900 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Click to view hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white text-stone-900 px-4 py-2 rounded shadow-lg text-sm">
            View full size
          </div>
        </div>
      </div>
    </div>
  )
}
