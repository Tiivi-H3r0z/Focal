'use client'

import { useState, useEffect } from 'react'
import type { Photo, Selection } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

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

  const currentPhoto = photos[index]
  const currentSelection = selections.get(currentPhoto.id)
  const isSelected = !!currentSelection

  useEffect(() => {
    setCommentText(currentSelection?.comment || '')
  }, [currentSelection])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === ' ') {
        e.preventDefault()
        handleToggleSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, isSelected])

  const handleNext = () => {
    if (index < photos.length - 1) {
      setIndex(index + 1)
      setShowCommentInput(false)
    }
  }

  const handlePrevious = () => {
    if (index > 0) {
      setIndex(index - 1)
      setShowCommentInput(false)
    }
  }

  const handleToggleSelection = () => {
    if (isLocked) return
    onToggleSelection(currentPhoto)
  }

  const handleSaveComment = () => {
    if (isSelected) {
      onUpdateComment(currentPhoto, commentText)
    } else {
      onToggleSelection(currentPhoto, commentText)
    }
    setShowCommentInput(false)
  }

  const getPhotoUrl = (photo: Photo) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <div className="flex items-center space-x-4">
          <h3 className="text-white text-lg font-medium">
            {currentPhoto.original_filename}
          </h3>
          {currentSelection?.comment && (
            <span className="text-brand-400 text-sm flex items-center">
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Has comment
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 p-2"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous Button */}
        {index > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Image */}
        <img
          src={getPhotoUrl(currentPhoto)}
          alt={currentPhoto.original_filename}
          className="max-w-full max-h-full object-contain"
        />

        {/* Next Button */}
        {index < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black bg-opacity-50 p-4">
        <div className="max-w-4xl mx-auto">
          {!showCommentInput ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Selection Toggle */}
                {!isLocked && (
                  <button
                    onClick={handleToggleSelection}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isSelected ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      )}
                    </svg>
                    <span>{isSelected ? 'Remove from Basket' : 'Add to Basket'}</span>
                  </button>
                )}

                {/* Comment Button */}
                {!isLocked && (
                  <button
                    onClick={() => setShowCommentInput(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>{currentSelection?.comment ? 'Edit Comment' : 'Add Comment'}</span>
                  </button>
                )}
              </div>

              {/* Current Comment Display */}
              {currentSelection?.comment && (
                <div className="max-w-md">
                  <p className="text-gray-300 text-sm italic">
                    "{currentSelection.comment}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment (e.g., 'black & white please', 'crop tighter', etc.)"
                rows={3}
                autoFocus
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-400"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCommentInput(false)
                    setCommentText(currentSelection?.comment || '')
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComment}
                  className="px-4 py-2 rounded-lg font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  Save Comment
                </button>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-3 text-center text-gray-500 text-xs">
            <span className="mr-4">← → Navigate</span>
            <span className="mr-4">Space: Toggle selection</span>
            <span>Esc: Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
