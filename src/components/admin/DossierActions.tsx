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

      {dossier.status === 'locked' && (
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
      )}
    </div>
  )
}
