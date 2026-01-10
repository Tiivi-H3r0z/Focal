'use client'

import { useState, useMemo } from 'react'
import type { Dossier, Photo, Selection } from '@/lib/types/database.types'
import PhotoGrid from './PhotoGrid'
import SelectionCounter from './SelectionCounter'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ClientGalleryProps {
  dossier: Dossier
  photos: Photo[]
  initialSelections: Selection[]
}

export default function ClientGallery({
  dossier,
  photos,
  initialSelections,
}: ClientGalleryProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selections, setSelections] = useState<Map<string, Selection>>(
    new Map(initialSelections.map((s) => [s.photo_id, s]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const isLocked = dossier.status === 'locked'
  const minAllowed = dossier.photo_limit - dossier.photo_limit_tolerance
  const maxAllowed = dossier.photo_limit + dossier.photo_limit_tolerance

  const filteredPhotos = useMemo(() => {
    if (!searchTerm) return photos
    return photos.filter((photo) =>
      photo.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [photos, searchTerm])

  const handleToggleSelection = async (
    photo: Photo,
    comment: string | null = null
  ) => {
    if (isLocked) return

    const newSelections = new Map(selections)

    if (newSelections.has(photo.id)) {
      // Remove selection
      const selection = newSelections.get(photo.id)!
      await supabase.from('selections').delete().eq('id', selection.id)
      newSelections.delete(photo.id)
    } else {
      // Add selection
      const { data, error } = await supabase
        .from('selections')
        .insert({
          dossier_id: dossier.id,
          photo_id: photo.id,
          comment,
        })
        .select()
        .single()

      if (!error && data) {
        newSelections.set(photo.id, data)
      }
    }

    setSelections(newSelections)
  }

  const handleUpdateComment = async (photo: Photo, comment: string) => {
    const selection = selections.get(photo.id)
    if (!selection) return

    const { error } = await supabase
      .from('selections')
      .update({ comment })
      .eq('id', selection.id)

    if (!error) {
      const newSelections = new Map(selections)
      newSelections.set(photo.id, { ...selection, comment })
      setSelections(newSelections)
    }
  }

  const handleSubmit = async () => {
    if (isLocked) return

    if (
      !confirm(
        `Submit your selection of ${selections.size} photos? You can still modify your selection later if needed.`
      )
    ) {
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('dossiers')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', dossier.id)

    if (!error) {
      router.refresh()
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-700">Focal</h1>
              <p className="text-sm text-gray-600">
                {dossier.client_name}'s Gallery
              </p>
            </div>
            <SelectionCounter
              selected={selections.size}
              target={dossier.photo_limit}
              tolerance={dossier.photo_limit_tolerance}
              isLocked={isLocked}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search photos by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {isLocked && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-purple-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-purple-800">
                  Selection Locked
                </h3>
                <p className="mt-1 text-sm text-purple-700">
                  Your selection has been received and is being processed. You
                  can view your selections but cannot make changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {dossier.status === 'submitted' && !isLocked && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Selection Submitted
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your selection has been submitted! You can still modify your
                  choices until the photographer locks the selection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PhotoGrid
          photos={filteredPhotos}
          selections={selections}
          onToggleSelection={handleToggleSelection}
          onUpdateComment={handleUpdateComment}
          isLocked={isLocked}
        />

        {filteredPhotos.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-500">No photos found matching "{searchTerm}"</p>
          </div>
        )}
      </main>
    </div>
  )
}
