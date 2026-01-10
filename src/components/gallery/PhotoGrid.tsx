'use client'

import type { Photo, Selection } from '@/lib/types/database.types'
import PhotoCard from './PhotoCard'

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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selection={selections.get(photo.id)}
          onToggleSelection={onToggleSelection}
          onUpdateComment={onUpdateComment}
          isLocked={isLocked}
        />
      ))}
    </div>
  )
}
