import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DossierCard from '@/components/admin/DossierCard'
import type { DossierWithStats } from '@/lib/types/database.types'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch dossiers with stats
  const { data: dossiers, error } = await supabase
    .from('dossier_stats')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching dossiers:', error)
  }

  const dossiersWithStats = (dossiers || []) as any[]

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Dossiers</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your client photo selections
          </p>
        </div>
        <Link
          href="/admin/dossiers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Dossier
        </Link>
      </div>

      {dossiersWithStats.length === 0 ? (
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
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No dossiers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new client dossier.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/dossiers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
            >
              Create New Dossier
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dossiersWithStats.map((dossier) => (
            <DossierCard key={dossier.id} dossier={dossier} />
          ))}
        </div>
      )}
    </div>
  )
}
