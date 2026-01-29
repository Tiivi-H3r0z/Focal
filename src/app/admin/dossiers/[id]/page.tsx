import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import DossierActions from '@/components/admin/DossierActions'
import PhotoGallery from '@/components/admin/PhotoGallery'
import SelectionViewer from '@/components/admin/SelectionViewer'
import CopyButton from '@/components/admin/CopyButton'

export default async function DossierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Fetch dossier
  const { data: dossierData, error: dossierError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (dossierError || !dossierData) {
    notFound()
  }

  // Serialize dossier to remove any non-serializable data
  const dossier = JSON.parse(JSON.stringify(dossierData))

  // Fetch photos
  const { data: photosData } = await supabase
    .from('photos')
    .select('*')
    .eq('dossier_id', params.id)
    .order('display_order', { ascending: true })

  // Serialize photos
  const photos = photosData ? JSON.parse(JSON.stringify(photosData)) : []

  // Fetch selections
  const { data: selectionsData } = await supabase
    .from('selections')
    .select('*, photos(*)')
    .eq('dossier_id', params.id)

  // Serialize selections
  const selections = selectionsData ? JSON.parse(JSON.stringify(selectionsData)) : []

  const photoCount = photos.length
  const selectionCount = selections.length
  const isAtLimit = selectionCount === dossier.photo_limit
  const isOverLimit = selectionCount > dossier.photo_limit

  // Get the host from request headers for dynamic URL generation
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const galleryUrl = `${protocol}://${host}/gallery/${dossier.secret_url}`

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block"
            >
              ← Retour au tableau de bord
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {dossier.client_name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Visibility indicator */}
            {dossier.visible ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Visible
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                Caché
              </span>
            )}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                dossier.status
              )}`}
            >
              {getStatusLabel(dossier.status)}
            </span>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations client
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dossier.client_email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dossier.client_email}
                </dd>
              </div>
            )}
            {dossier.client_phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dossier.client_phone}
                </dd>
              </div>
            )}
            {dossier.client_address && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dossier.client_address}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Photos à sélectionner</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {dossier.photo_limit}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Créé le</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(dossier.created_at)}
              </dd>
            </div>
            {dossier.notification_email && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Email de notification</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dossier.notification_email}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-brand-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-brand-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total photos
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {photoCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Photos sélectionnées
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {selectionCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 rounded-md p-3 ${
                  isAtLimit
                    ? 'bg-green-100'
                    : isOverLimit
                    ? 'bg-orange-100'
                    : 'bg-gray-100'
                }`}
              >
                <svg
                  className={`h-6 w-6 ${
                    isAtLimit
                      ? 'text-green-600'
                      : isOverLimit
                      ? 'text-orange-600'
                      : 'text-gray-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Objectif
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dossier.photo_limit}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery URL */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            URL de la galerie client
          </h3>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-white px-3 py-2 rounded text-sm text-blue-800 border border-blue-300">
              {galleryUrl}
            </code>
            <CopyButton text={galleryUrl} />
          </div>
          {!dossier.visible && (
            <p className="mt-2 text-sm text-blue-700">
              ⚠️ Le dossier est actuellement caché. Le client ne peut pas accéder à la galerie.
            </p>
          )}
        </div>

        {/* Selection Viewer */}
        {selectionCount > 0 && (
          <div className="mb-6">
            <SelectionViewer
              selections={selections}
              dossier={dossier}
            />
          </div>
        )}

        {/* Actions */}
        <DossierActions dossier={dossier} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <span className="border-brand-500 text-brand-600 border-b-2 py-4 px-1 text-sm font-medium">
            Photos ({photoCount})
          </span>
          {selectionCount > 0 && (
            <Link
              href={`/admin/dossiers/${params.id}/selections`}
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 py-4 px-1 text-sm font-medium"
            >
              Sélections ({selectionCount})
            </Link>
          )}
        </nav>
      </div>

      {/* Photo Gallery or Upload */}
      {photoCount === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune photo</h3>
          <p className="mt-1 text-sm text-gray-500">
            Téléversez des photos pour les partager avec votre client.
          </p>
          <div className="mt-6">
            <Link
              href={`/admin/dossiers/${params.id}/upload`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
            >
              Téléverser des photos
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <Link
              href={`/admin/dossiers/${params.id}/upload`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
            >
              Ajouter des photos
            </Link>
          </div>
          <PhotoGallery photos={photos} dossierId={params.id} />
        </div>
      )}
    </div>
  )
}
