'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSecretUrl } from '@/lib/utils'

export default function NewDossierPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    photo_limit: 25,
    photo_limit_tolerance: 5,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error: insertError } = await supabase
        .from('dossiers')
        .insert({
          photographer_id: user.id,
          client_name: formData.client_name,
          client_email: formData.client_email || null,
          client_phone: formData.client_phone || null,
          client_address: formData.client_address || null,
          photo_limit: formData.photo_limit,
          photo_limit_tolerance: formData.photo_limit_tolerance,
          secret_url: generateSecretUrl(),
          status: 'draft',
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      router.push(`/admin/dossiers/${data.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create dossier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Dossier</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up a new client photo selection project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="client_name"
              className="block text-sm font-medium text-gray-700"
            >
              Client Name *
            </label>
            <input
              type="text"
              id="client_name"
              required
              value={formData.client_name}
              onChange={(e) =>
                setFormData({ ...formData, client_name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="client_email"
              className="block text-sm font-medium text-gray-700"
            >
              Client Email
            </label>
            <input
              type="email"
              id="client_email"
              value={formData.client_email}
              onChange={(e) =>
                setFormData({ ...formData, client_email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="client_phone"
              className="block text-sm font-medium text-gray-700"
            >
              Client Phone
            </label>
            <input
              type="tel"
              id="client_phone"
              value={formData.client_phone}
              onChange={(e) =>
                setFormData({ ...formData, client_phone: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="client_address"
              className="block text-sm font-medium text-gray-700"
            >
              Client Address
            </label>
            <textarea
              id="client_address"
              rows={3}
              value={formData.client_address}
              onChange={(e) =>
                setFormData({ ...formData, client_address: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="photo_limit"
                className="block text-sm font-medium text-gray-700"
              >
                Photo Limit *
              </label>
              <input
                type="number"
                id="photo_limit"
                required
                min="1"
                value={formData.photo_limit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    photo_limit: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="photo_limit_tolerance"
                className="block text-sm font-medium text-gray-700"
              >
                Tolerance (±) *
              </label>
              <input
                type="number"
                id="photo_limit_tolerance"
                required
                min="0"
                value={formData.photo_limit_tolerance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    photo_limit_tolerance: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border px-3 py-2"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              Client will be able to select between{' '}
              <strong>
                {formData.photo_limit - formData.photo_limit_tolerance}
              </strong>{' '}
              and{' '}
              <strong>
                {formData.photo_limit + formData.photo_limit_tolerance}
              </strong>{' '}
              photos.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}
