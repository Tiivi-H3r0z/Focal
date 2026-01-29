'use client'

import { useState, useCallback, useRef } from 'react'
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
  currentBatch: number
  totalBatches: number
  errors: string[]
}

// Batch size for uploads - balance between speed and memory
const BATCH_SIZE = 50

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_BASE = 1000 // 1 second base delay

// Sanitize filenames to remove accents and special characters
function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename
  const ext = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : ''

  const sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  return sanitized + ext
}

// Sleep function for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function PhotoUploader({ dossierId }: PhotoUploaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  const uploadFileWithRetry = async (
    file: File,
    index: number,
    total: number,
    retries = 0
  ): Promise<boolean> => {
    if (cancelledRef.current) return false

    const originalFilename = file.name
    const sanitizedFilename = sanitizeFilename(originalFilename)
    const storagePath = `${dossierId}/${sanitizedFilename}`

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // If file already exists, skip it
        if (uploadError.message.includes('already exists') || uploadError.message.includes('Duplicate')) {
          console.log(`Skipping duplicate: ${originalFilename}`)
          return true
        }
        throw uploadError
      }

      // Insert to database
      const { error: dbError } = await supabase.from('photos').insert({
        dossier_id: dossierId,
        original_filename: originalFilename,
        storage_path: storagePath,
        file_size: file.size,
        display_order: index,
      })

      if (dbError) {
        // If DB insert fails, clean up storage
        if (!dbError.message.includes('duplicate')) {
          await supabase.storage.from('photos').remove([storagePath])
          throw dbError
        }
      }

      return true
    } catch (err: any) {
      if (retries < MAX_RETRIES) {
        // Exponential backoff
        const delay = RETRY_DELAY_BASE * Math.pow(2, retries)
        console.log(`Retry ${retries + 1}/${MAX_RETRIES} for ${originalFilename} after ${delay}ms`)
        await sleep(delay)
        return uploadFileWithRetry(file, index, total, retries + 1)
      }
      throw new Error(`Failed to upload ${originalFilename} after ${MAX_RETRIES} retries: ${err.message}`)
    }
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return

    setError(null)
    setUploading(true)
    cancelledRef.current = false

    const totalBatches = Math.ceil(files.length / BATCH_SIZE)
    const errors: string[] = []

    setProgress({
      total: files.length,
      uploaded: 0,
      currentFile: '',
      currentBatch: 0,
      totalBatches,
      errors: [],
    })

    try {
      let uploadedCount = 0

      // Process files in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (cancelledRef.current) break

        const start = batchIndex * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, files.length)
        const batch = files.slice(start, end)

        setProgress(prev => ({
          ...prev!,
          currentBatch: batchIndex + 1,
          currentFile: `Batch ${batchIndex + 1}/${totalBatches}`,
        }))

        // Process batch files concurrently (but not all at once)
        const CONCURRENT_UPLOADS = 5
        for (let i = 0; i < batch.length; i += CONCURRENT_UPLOADS) {
          if (cancelledRef.current) break

          const chunk = batch.slice(i, i + CONCURRENT_UPLOADS)
          const uploadPromises = chunk.map((file, chunkIndex) => {
            const globalIndex = start + i + chunkIndex
            return uploadFileWithRetry(file, globalIndex, files.length)
              .then(() => {
                uploadedCount++
                setProgress(prev => ({
                  ...prev!,
                  uploaded: uploadedCount,
                  currentFile: file.name,
                }))
                return { success: true, file: file.name }
              })
              .catch((err) => {
                errors.push(`${file.name}: ${err.message}`)
                return { success: false, file: file.name, error: err.message }
              })
          })

          await Promise.all(uploadPromises)
        }

        // Small delay between batches to prevent overwhelming the server
        if (batchIndex < totalBatches - 1) {
          await sleep(100)
        }
      }

      setProgress(prev => ({
        ...prev!,
        uploaded: uploadedCount,
        currentFile: 'Terminé !',
        errors,
      }))

      // Show final status and redirect
      setTimeout(() => {
        if (errors.length > 0) {
          setError(`${errors.length} fichier(s) n'ont pas pu être téléversés. ${uploadedCount} fichier(s) téléversés avec succès.`)
          setUploading(false)
        } else {
          router.push(`/admin/dossiers/${dossierId}`)
          router.refresh()
        }
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Échec du téléversement')
      setUploading(false)
    }
  }

  const handleCancel = () => {
    cancelledRef.current = true
    setUploading(false)
    setProgress(null)
    router.push(`/admin/dossiers/${dossierId}`)
    router.refresh()
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
      setProgress({
        total: 0,
        uploaded: 0,
        currentFile: 'Extraction du ZIP...',
        currentBatch: 0,
        totalBatches: 0,
        errors: [],
      })

      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      const files: File[] = []

      // Extract files from ZIP in batches to manage memory
      const entries = Object.entries(contents.files).filter(
        ([filename, entry]) => !entry.dir && !filename.startsWith('__MACOSX') && !filename.includes('._')
      )

      setProgress(prev => ({
        ...prev!,
        total: entries.length,
        currentFile: `Extraction de ${entries.length} fichiers...`,
      }))

      // Extract in batches of 100 to manage memory
      const EXTRACT_BATCH = 100
      for (let i = 0; i < entries.length; i += EXTRACT_BATCH) {
        const batch = entries.slice(i, i + EXTRACT_BATCH)
        const extractPromises = batch.map(async ([filename, zipEntry]) => {
          const blob = await zipEntry.async('blob')
          const extractedFilename = filename.split('/').pop() || filename
          return new File([blob], extractedFilename, {
            type: blob.type || 'image/jpeg',
          })
        })

        const extractedFiles = await Promise.all(extractPromises)
        files.push(...extractedFiles)

        setProgress(prev => ({
          ...prev!,
          currentFile: `Extrait ${files.length}/${entries.length} fichiers...`,
        }))
      }

      // Now upload the extracted files
      await handleFiles(files)
    } catch (err: any) {
      setError(err.message || 'Échec de l\'extraction du fichier ZIP')
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

  const progressPercent = progress ? (progress.uploaded / progress.total) * 100 : 0

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
            Téléversement en cours...
          </h3>
          {progress && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-2">
                {progress.uploaded} / {progress.total} fichiers téléversés
              </p>
              {progress.totalBatches > 1 && (
                <p className="text-xs text-gray-500 mb-2">
                  Lot {progress.currentBatch} / {progress.totalBatches}
                </p>
              )}
              <p className="text-xs text-gray-500 mb-4 truncate max-w-full">
                {progress.currentFile}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-brand-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {Math.round(progressPercent)}% terminé
              </p>
              {progress.errors.length > 0 && (
                <p className="text-xs text-orange-600 mb-4">
                  {progress.errors.length} erreur(s) rencontrée(s)
                </p>
              )}
              <button
                onClick={handleCancel}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Annuler et voir les photos téléversées
              </button>
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
                Cliquez pour sélectionner
              </label>{' '}
              ou glissez-déposez
            </p>
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG (supporte jusqu'à 3000+ photos)
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
              <span className="px-4 text-sm text-gray-500">OU</span>
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
                Téléverser un fichier ZIP
              </label>
              <input
                id="zip-upload"
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500">
                Téléversez un fichier ZIP contenant vos photos (recommandé pour 1000+ photos)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
