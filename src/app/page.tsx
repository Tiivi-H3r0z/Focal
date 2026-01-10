import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif text-stone-900">Les Augustins Photographie</h1>
              <p className="text-sm text-stone-500 mt-1">Photo Selection Platform</p>
            </div>
            <Link
              href="/login"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Photographer Access
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-6">
          <h2 className="text-5xl sm:text-6xl font-serif text-stone-900 tracking-tight">
            Your Photos,
            <br />
            Your Selection
          </h2>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            A seamless way to review and select your favorite moments from your photo session
          </p>
        </div>

        {/* How it works */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif text-stone-900">1. Receive Your Link</h3>
            <p className="text-sm text-stone-600">
              You'll receive a private link to access your personal gallery
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif text-stone-900">2. Browse & Select</h3>
            <p className="text-sm text-stone-600">
              Review all photos and choose your favorites with a simple click
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif text-stone-900">3. Finalize</h3>
            <p className="text-sm text-stone-600">
              Submit your selection and receive your edited photos
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              © {new Date().getFullYear()} Les Augustins Photographie
            </p>
            <p className="text-xs text-stone-400">
              Powered by Focal
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
