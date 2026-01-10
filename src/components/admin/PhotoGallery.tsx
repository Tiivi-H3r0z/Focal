'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Photo } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PhotoGalleryProps {
  photos: Photo[]
  dossierId: string
}

export default function PhotoGallery({ photos, dossierId }: PhotoGalleryProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (photo: Photo) => {
    if (!confirm(`Delete ${photo.original_filename}?`)) {
      return
    }

    setDeleting(photo.id)

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([photo.storage_path])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      setDeleting(null)
      return
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photo.id)

    if (!dbError) {
      router.refresh()
    }

    setDeleting(null)
  }

  const getPhotoUrl = (photo: Photo) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(photo.storage_path)
    return data.publicUrl
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getPhotoUrl(photo)}
              alt={photo.original_filename}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-600 truncate flex-1">
              {photo.original_filename}
            </p>
            <button
              onClick={() => handleDelete(photo)}
              disabled={deleting === photo.id}
              className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Delete photo"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
