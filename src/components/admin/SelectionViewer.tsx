'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Selection, Photo, Dossier } from '@/lib/types/database.types'

interface SelectionWithPhoto extends Selection {
  photos: Photo
}

interface SelectionViewerProps {
  selections: SelectionWithPhoto[]
  dossier: Dossier
}

// Helper function to remove file extension from filename
function removeExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) return filename
  return filename.substring(0, lastDotIndex)
}

export default function SelectionViewer({
  selections,
  dossier,
}: SelectionViewerProps) {
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  // Generate comma-separated list of filenames without extensions
  const commaList = selections
    .map((s) => removeExtension(s.photos.original_filename))
    .sort()
    .join(', ')

  // Filter selections to only include those with comments
  const selectionsWithComments = selections.filter(
    (selection) => selection.comment && selection.comment.trim() !== ''
  )

  // Helper function to get photo URL
  const getPhotoUrl = (photo: Photo) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commaList)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const minAllowed = dossier.photo_limit - dossier.photo_limit_tolerance
  const maxAllowed = dossier.photo_limit + dossier.photo_limit_tolerance
  const isWithinRange =
    selections.length >= minAllowed && selections.length <= maxAllowed

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Client Selection
        </h2>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isWithinRange
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {selections.length} / {dossier.photo_limit} (±
            {dossier.photo_limit_tolerance})
          </span>
        </div>
      </div>

      {!isWithinRange && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-md p-4">
          <p className="text-sm text-orange-800">
            {selections.length < minAllowed
              ? `Client selected ${selections.length} photos, but the minimum is ${minAllowed}.`
              : `Client selected ${selections.length} photos, exceeding the maximum of ${maxAllowed}.`}
          </p>
        </div>
      )}

      {/* Lightroom Export - Top */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comma-Separated List for Adobe Lightroom
        </label>
        <div className="flex items-start space-x-2">
          <textarea
            readOnly
            value={commaList}
            rows={3}
            className="flex-1 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md p-3"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm font-medium"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Photos with Comments */}
      {selectionsWithComments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Photos with Comments
          </h3>
          <div className="space-y-6">
            {selectionsWithComments.map((selection) => (
              <div
                key={selection.id}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="mb-3">
                  <img
                    src={getPhotoUrl(selection.photos)}
                    alt={selection.photos.original_filename}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div>
                  <p className="font-mono text-xs text-gray-500 mb-2">
                    {selection.photos.original_filename}
                  </p>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
                    {selection.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
