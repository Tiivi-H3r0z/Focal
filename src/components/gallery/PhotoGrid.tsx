'use client'

import { useState, useMemo } from 'react'
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

// Generate a deterministic aspect ratio based on photo index for visual variety
function getAspectRatio(index: number): 'portrait' | 'landscape' | 'square' {
  if (index % 7 === 0) return 'portrait'
  if (index % 5 === 0) return 'landscape'
  return 'square'
}

export default function PhotoGrid({
  photos,
  selections,
  onToggleSelection,
  onUpdateComment,
  isLocked,
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Memoize aspect ratios to prevent recalculation
  const photoAspectRatios = useMemo(() => {
    return photos.map((_, index) => getAspectRatio(index))
  }, [photos])

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
            aspectRatio={photoAspectRatios[index]}
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
