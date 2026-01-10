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
      className={`relative group rounded-lg overflow-hidden transition-all ${
        isSelected
          ? 'ring-4 ring-brand-500 shadow-lg'
          : 'hover:shadow-md'
      }`}
    >
      {/* Photo */}
      <div
        className="aspect-square bg-gray-100 cursor-pointer"
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
        className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity ${
          isLocked ? 'cursor-not-allowed' : ''
        }`}
      >
        {/* Checkbox */}
        {!isLocked && (
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="h-6 w-6 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
          </div>
        )}

        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-brand-600 text-white px-2 py-1 rounded text-xs font-medium">
            Selected
          </div>
        )}

        {/* Comment Indicator */}
        {selection?.comment && (
          <div className="absolute bottom-2 left-2 bg-brand-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>Comment</span>
          </div>
        )}

        {/* Click to view hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
            Click to view
          </div>
        </div>
      </div>

      {/* Filename */}
      <div className="p-2 bg-white">
        <p className="text-xs text-gray-600 truncate" title={photo.original_filename}>
          {photo.original_filename}
        </p>
        {selection?.comment && (
          <p className="text-xs text-brand-600 truncate mt-1" title={selection.comment}>
            💬 {selection.comment}
          </p>
        )}
      </div>
    </div>
  )
}
