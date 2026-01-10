import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PhotoUploader from '@/components/admin/PhotoUploader'

export default async function UploadPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: dossier, error } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !dossier) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <Link
          href={`/admin/dossiers/${params.id}`}
          className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block"
        >
          ← Back to Dossier
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Upload Photos</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload photos for {dossier.client_name}
        </p>
      </div>

      <PhotoUploader dossierId={params.id} />
    </div>
  )
}
