'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import JSZip from 'jszip'

interface PhotoUploaderProps {
  dossierId: string
}

interface UploadProgress {
  total: number
  uploaded: number
  currentFile: string
}

export default function PhotoUploader({ dossierId }: PhotoUploaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File, index: number, total: number) => {
    const filename = file.name
    const storagePath = `${dossierId}/${filename}`

    setProgress({
      total,
      uploaded: index,
      currentFile: filename,
    })

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error(`Error uploading ${filename}:`, uploadError)
      throw new Error(`Failed to upload ${filename}: ${uploadError.message}`)
    }

    // Insert to database
    const { error: dbError } = await supabase.from('photos').insert({
      dossier_id: dossierId,
      original_filename: filename,
      storage_path: storagePath,
      file_size: file.size,
      display_order: index,
    })

    if (dbError) {
      console.error(`Error saving ${filename} to database:`, dbError)
      // Try to delete from storage if DB insert fails
      await supabase.storage.from('photos').remove([storagePath])
      throw new Error(`Failed to save ${filename} to database`)
    }
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return

    setError(null)
    setUploading(true)
    setProgress({ total: files.length, uploaded: 0, currentFile: '' })

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i], i, files.length)
      }

      setProgress({ total: files.length, uploaded: files.length, currentFile: 'Done!' })

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/dossiers/${dossierId}`)
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      const files: File[] = []

      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && !filename.startsWith('__MACOSX')) {
          const blob = await zipEntry.async('blob')
          const file = new File([blob], filename.split('/').pop() || filename, {
            type: 'image/jpeg',
          })
          files.push(file)
        }
      }

      await handleFiles(files)
    } catch (err: any) {
      setError(err.message || 'Failed to extract ZIP file')
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {uploading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Uploading Photos...
          </h3>
          {progress && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-2">
                {progress.uploaded} of {progress.total} uploaded
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Current: {progress.currentFile}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(progress.uploaded / progress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-brand-400 transition-colors"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-4 text-sm text-gray-600">
              <label htmlFor="file-upload" className="cursor-pointer text-brand-600 hover:text-brand-700 font-medium">
                Click to select files
              </label>{' '}
              or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG images (supports multiple files)
            </p>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* ZIP Upload */}
          <div className="mt-6">
            <div className="flex items-center justify-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="mt-6 text-center">
              <label
                htmlFor="zip-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <svg
                  className="mr-2 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload ZIP File
              </label>
              <input
                id="zip-upload"
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500">
                Upload a ZIP file containing your photos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
