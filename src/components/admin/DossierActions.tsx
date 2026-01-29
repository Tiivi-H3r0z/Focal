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

  const handleToggleVisibility = async () => {
    const newVisibility = !dossier.visible
    const confirmMessage = newVisibility
      ? 'Rendre ce dossier visible ? Le client pourra accéder à la galerie.'
      : 'Cacher ce dossier ? Le client ne pourra plus accéder à la galerie.'

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('dossiers')
      .update({ visible: newVisibility })
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
        'Verrouiller ce dossier ? Le client ne pourra plus modifier sa sélection.'
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
        '⚠️ ATTENTION : Êtes-vous sûr de vouloir SUPPRIMER ce dossier ?\n\nCette action supprimera définitivement :\n- Toutes les photos\n- Toutes les sélections du client\n- Toutes les données du dossier\n\nCette action est IRRÉVERSIBLE !'
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
        alert(`Erreur lors de la suppression: ${data.error}`)
      }
    } catch (error) {
      alert('Erreur lors de la suppression du dossier')
      console.error(error)
    }
    setLoading(false)
  }

  const handleArchive = async () => {
    if (
      !confirm(
        'Archiver ce dossier ?\n\nCela supprimera toutes les photos SAUF celles sélectionnées par le client.\n\nLe dossier pourra être désarchivé plus tard si nécessaire.'
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
          `Dossier archivé avec succès. ${data.deletedPhotos} photos supprimées.`
        )
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Erreur lors de l'archivage: ${data.error}`)
      }
    } catch (error) {
      alert("Erreur lors de l'archivage du dossier")
      console.error(error)
    }
    setLoading(false)
  }

  const handleUnarchive = async () => {
    if (
      !confirm(
        'Désarchiver ce dossier ?\n\nLe dossier sera à nouveau disponible pour le client.'
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
        alert('Dossier désarchivé avec succès.')
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Erreur lors du désarchivage: ${data.error}`)
      }
    } catch (error) {
      alert('Erreur lors du désarchivage du dossier')
      console.error(error)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Visibility Toggle - Primary action */}
      <button
        onClick={handleToggleVisibility}
        disabled={loading}
        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${
          dossier.visible
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {dossier.visible ? (
          <>
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            Cacher
          </>
        ) : (
          <>
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Montrer
          </>
        )}
      </button>

      {dossier.visible && (
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
              ? 'Marquer non contacté'
              : 'Marquer contacté'}
          </button>

          {dossier.status !== 'locked' && (
            <button
              onClick={handleLock}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              Verrouiller
            </button>
          )}
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
            Verrouillé
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
            Archiver
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
            Archivé
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
            Désarchiver
          </button>
        </>
      )}

      {/* Delete button - available for all states */}
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
        Supprimer
      </button>
    </div>
  )
}
