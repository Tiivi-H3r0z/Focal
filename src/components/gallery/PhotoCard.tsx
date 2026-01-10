'use client'

import { useState } from 'react'
import type { Photo, Selection } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import CommentModal from './CommentModal'

interface PhotoCardProps {
  photo: Photo
  selection?: Selection
  onToggleSelection: (photo: Photo, comment?: string | null) => void
  onUpdateComment: (photo: Photo, comment: string) => void
  isLocked: boolean
}

export default function PhotoCard({
  photo,
  selection,
  onToggleSelection,
  onUpdateComment,
  isLocked,
}: PhotoCardProps) {
  const supabase = createClient()
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
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

  const handleCommentSave = (comment: string) => {
    if (isSelected) {
      onUpdateComment(photo, comment)
    } else {
      onToggleSelection(photo, comment)
    }
    setShowCommentModal(false)
  }

  return (
    <>
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
          onClick={() => setShowZoom(true)}
        >
          <img
            src={getPhotoUrl()}
            alt={photo.original_filename}
            className="w-full h-full object-cover"
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

          {/* Comment Button */}
          {!isLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCommentModal(true)
              }}
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
            >
              {selection?.comment ? 'Edit Comment' : 'Add Comment'}
            </button>
          )}
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

      {/* Zoom Modal */}
      {showZoom && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setShowZoom(false)}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={getPhotoUrl()}
            alt={photo.original_filename}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <CommentModal
          photo={photo}
          initialComment={selection?.comment || ''}
          onSave={handleCommentSave}
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </>
  )
}
