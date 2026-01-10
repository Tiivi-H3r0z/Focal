import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SelectionViewer from '@/components/admin/SelectionViewer'

export default async function SelectionsPage({
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

  // Fetch selections with photo details
  const { data: selections } = await supabase
    .from('selections')
    .select('*, photos(*)')
    .eq('dossier_id', params.id)

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link
          href={`/admin/dossiers/${params.id}`}
          className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block"
        >
          ← Back to Dossier
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Client Selections
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {dossier.client_name} - {selections?.length || 0} photos selected
        </p>
      </div>

      {selections && selections.length > 0 ? (
        <SelectionViewer selections={selections as any} dossier={dossier} />
      ) : (
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No selections yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The client hasn't selected any photos yet.
          </p>
        </div>
      )}
    </div>
  )
}
