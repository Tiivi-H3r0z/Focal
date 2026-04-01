'use client'

import type { Photo, Selection } from '@/lib/types/database.types'
import PhotoCard from './PhotoCard'

interface PhotoGridProps {
  photos: Photo[]
  selections: Map<string, Selection>
  onToggleSelection: (photo: Photo, comment?: string | null) => void
  onUpdateComment: (photo: Photo, comment: string) => void
  isLocked: boolean
  showOnlySelected?: boolean
  isAtLimit?: boolean
  gridSize?: 'small' | 'medium' | 'large'
  onPhotoClick: (index: number) => void
  startIndex?: number
}

export default function PhotoGrid({
  photos,
  selections,
  onToggleSelection,
  onUpdateComment,
  isLocked,
  showOnlySelected = false,
  isAtLimit = false,
  gridSize = 'medium',
  onPhotoClick,
  startIndex = 0,
}: PhotoGridProps) {
  return (
    <div className={`masonry-grid masonry-grid-${gridSize}`}>
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selection={selections.get(photo.id)}
          onToggleSelection={onToggleSelection}
          onUpdateComment={onUpdateComment}
          onPhotoClick={() => onPhotoClick(startIndex + index)}
          isLocked={isLocked}
          showOnlySelected={showOnlySelected}
          isAtLimit={isAtLimit}
        />
      ))}
    </div>
  )
}
