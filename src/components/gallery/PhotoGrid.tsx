'use client'

import { useState } from 'react'
import type { Photo, Selection } from '@/lib/types/database.types'
import PhotoCard from './PhotoCard'
import PhotoLightbox from './PhotoLightbox'

interface PhotoGridProps {
  photos: Photo[]
  selections: Map<string, Selection>
  onToggleSelection: (photo: Photo, comment?: string | null) => void
  onUpdateComment: (photo: Photo, comment: string) => void
  isLocked: boolean
}

export default function PhotoGrid({
  photos,
  selections,
  onToggleSelection,
  onUpdateComment,
  isLocked,
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <>
      <div className="masonry-grid">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            selection={selections.get(photo.id)}
            onToggleSelection={onToggleSelection}
            onUpdateComment={onUpdateComment}
            onPhotoClick={() => setLightboxIndex(index)}
            isLocked={isLocked}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          selections={selections}
          onClose={() => setLightboxIndex(null)}
          onToggleSelection={onToggleSelection}
          onUpdateComment={onUpdateComment}
          isLocked={isLocked}
        />
      )}
    </>
  )
}
