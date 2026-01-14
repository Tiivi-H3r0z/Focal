import Link from 'next/link'
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import type { DossierStats } from '@/lib/types/database.types'

interface DossierCardProps {
  dossier: DossierStats
}

export default function DossierCard({ dossier }: DossierCardProps) {
  const isOverLimit = dossier.selected_photos > dossier.max_allowed
  const isUnderLimit = dossier.selected_photos < dossier.min_allowed
  const isWithinLimit =
    !isOverLimit && !isUnderLimit && dossier.selected_photos > 0

  return (
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
                  : isUnderLimit && dossier.status === 'submitted'
                  ? 'text-orange-600'
                  : isWithinLimit
                  ? 'text-green-600'
                  : 'text-gray-900'
              }`}
            >
              {dossier.selected_photos} / {dossier.photo_limit} (±
              {dossier.photo_limit_tolerance})
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
  )
}
