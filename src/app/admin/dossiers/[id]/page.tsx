import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import DossierActions from '@/components/admin/DossierActions'
import PhotoGallery from '@/components/admin/PhotoGallery'
import SelectionViewer from '@/components/admin/SelectionViewer'

export default async function DossierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Fetch dossier
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (dossierError || !dossier) {
    notFound()
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('dossier_id', params.id)
    .order('display_order', { ascending: true })

  // Fetch selections
  const { data: selections } = await supabase
    .from('selections')
    .select('*, photos(*)')
    .eq('dossier_id', params.id)

  const photoCount = photos?.length || 0
  const selectionCount = selections?.length || 0
  const minAllowed = dossier.photo_limit - dossier.photo_limit_tolerance
  const maxAllowed = dossier.photo_limit + dossier.photo_limit_tolerance

  const galleryUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/gallery/${dossier.secret_url}`

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
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {dossier.client_name}
            </h1>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              dossier.status
            )}`}
          >
            {getStatusLabel(dossier.status)}
          </span>
        </div>

        {/* Client Info Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Client Information
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
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dossier.client_phone}
                </dd>
              </div>
            )}
            {dossier.client_address && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dossier.client_address}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Photo Limit</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {dossier.photo_limit} (±{dossier.photo_limit_tolerance})
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(dossier.created_at)}
              </dd>
            </div>
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
                  Total Photos
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
                  Selected Photos
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
                  selectionCount >= minAllowed && selectionCount <= maxAllowed
                    ? 'bg-green-100'
                    : 'bg-orange-100'
                }`}
              >
                <svg
                  className={`h-6 w-6 ${
                    selectionCount >= minAllowed &&
                    selectionCount <= maxAllowed
                      ? 'text-green-600'
                      : 'text-orange-600'
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
                  Target Range
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {minAllowed}-{maxAllowed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery URL */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Client Gallery URL
          </h3>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-white px-3 py-2 rounded text-sm text-blue-800 border border-blue-300">
              {galleryUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(galleryUrl)}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>

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
              Selections ({selectionCount})
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload photos to share with your client.
          </p>
          <div className="mt-6">
            <Link
              href={`/admin/dossiers/${params.id}/upload`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
            >
              Upload Photos
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
              Upload More Photos
            </Link>
          </div>
          <PhotoGallery photos={photos || []} dossierId={params.id} />
        </div>
      )}

      {/* Selection Viewer */}
      {selectionCount > 0 && (
        <div className="mt-8">
          <SelectionViewer
            selections={selections || []}
            dossier={dossier}
          />
        </div>
      )}
    </div>
  )
}
