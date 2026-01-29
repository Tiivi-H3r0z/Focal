'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import type { DossierStats } from '@/lib/types/database.types'

interface DossierCardProps {
  dossier: DossierStats
}

export default function DossierCard({ dossier }: DossierCardProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAtLimit = dossier.selected_photos === dossier.photo_limit
  const isOverLimit = dossier.selected_photos > dossier.photo_limit

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)

    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Erreur lors de la suppression: ${data.error}`)
      }
    } catch (error) {
      alert('Erreur lors de la suppression du dossier')
      console.error(error)
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  return (
    <div className="relative group">
      <Link
        href={`/admin/dossiers/${dossier.id}`}
        className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {dossier.client_name}
            </h3>
            <div className="flex items-center gap-2">
              {/* Visibility indicator */}
              {dossier.visible ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Visible
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                  Caché
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  dossier.status
                )}`}
              >
                {getStatusLabel(dossier.status)}
              </span>
              {dossier.archived && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <svg
                    className="mr-1 h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path
                      fillRule="evenodd"
                      d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Archived
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Total Photos:</span>
              <span className="font-medium text-gray-900">
                {dossier.total_photos}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Selected:</span>
              <span
                className={`font-medium ${
                  isOverLimit
                    ? 'text-orange-600'
                    : isAtLimit
                    ? 'text-green-600'
                    : 'text-gray-900'
                }`}
              >
                {dossier.selected_photos} / {dossier.photo_limit}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Created:</span>
              <span className="font-medium text-gray-900">
                {formatDate(dossier.created_at)}
              </span>
            </div>

            {dossier.contacted_client && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="inline-flex items-center text-xs text-green-700">
                  <svg
                    className="mr-1.5 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Client contacted
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Delete button - appears on hover */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-gray-200"
        title="Supprimer le dossier"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={cancelDelete}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer le dossier ?</h3>
                <p className="text-sm text-gray-500">{dossier.client_name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Cette action supprimera définitivement le dossier, toutes les photos et les sélections du client. Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
