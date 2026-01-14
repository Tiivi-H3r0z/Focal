'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Dossier } from '@/lib/types/database.types'

interface DossierActionsProps {
  dossier: Dossier
}

export default function DossierActions({ dossier }: DossierActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    if (!confirm('Activate this dossier? The client will be able to access the gallery.')) {
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('dossiers')
      .update({ status: 'active' })
      .eq('id', dossier.id)

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleMarkContacted = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('dossiers')
      .update({
        contacted_client: !dossier.contacted_client,
      })
      .eq('id', dossier.id)

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleLock = async () => {
    if (
      !confirm(
        'Lock this dossier? The client will no longer be able to modify their selections.'
      )
    ) {
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('dossiers')
      .update({
        status: 'locked',
        locked_at: new Date().toISOString(),
      })
      .eq('id', dossier.id)

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (
      !confirm(
        '⚠️ WARNING: Are you sure you want to DELETE this dossier?\n\nThis will permanently delete:\n- All photos\n- All client selections\n- All dossier data\n\nThis action CANNOT be undone!'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Failed to delete dossier: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to delete dossier')
      console.error(error)
    }
    setLoading(false)
  }

  const handleArchive = async () => {
    if (
      !confirm(
        'Archive this dossier?\n\nThis will delete all photos EXCEPT the ones selected by the client.\n\nThe dossier can be unarchived later if needed.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/archive`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        alert(
          `Dossier archived successfully. ${data.deletedPhotos} photos deleted.`
        )
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Failed to archive dossier: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to archive dossier')
      console.error(error)
    }
    setLoading(false)
  }

  const handleUnarchive = async () => {
    if (
      !confirm(
        'Unarchive this dossier?\n\nThe dossier will be available to display to the client again.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/unarchive`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Dossier unarchived successfully.')
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Failed to unarchive dossier: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to unarchive dossier')
      console.error(error)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-3">
      {dossier.status === 'draft' && (
        <button
          onClick={handleActivate}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          Activate Dossier
        </button>
      )}

      {(dossier.status === 'active' || dossier.status === 'submitted') && (
        <>
          <button
            onClick={handleMarkContacted}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              dossier.contacted_client
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {dossier.contacted_client
              ? 'Mark as Not Contacted'
              : 'Mark as Contacted'}
          </button>

          <button
            onClick={handleLock}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Lock Dossier
          </button>
        </>
      )}

      {dossier.status === 'locked' && !dossier.archived && (
        <>
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-md text-sm font-medium">
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Dossier Locked
          </div>

          <button
            onClick={handleArchive}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            Archive Dossier
          </button>
        </>
      )}

      {dossier.archived && (
        <>
          <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-md text-sm font-medium">
            <svg
              className="mr-2 h-5 w-5"
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
          </div>

          <button
            onClick={handleUnarchive}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Unarchive
          </button>
        </>
      )}

      {/* Delete button - available for all statuses */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
      >
        <svg
          className="mr-2 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete Dossier
      </button>
    </div>
  )
}
