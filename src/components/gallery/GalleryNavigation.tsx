'use client'

import { Icons } from './Icons'

interface GalleryNavigationProps {
  selectedCount: number
  targetCount: number
  tolerance: number
  clientName: string
  photographerName?: string
  onSend: () => void
  showOnlySelected: boolean
  onToggleFilter: () => void
  isLocked: boolean
  submitting: boolean
}

export default function GalleryNavigation({
  selectedCount,
  targetCount,
  tolerance,
  clientName,
  photographerName = "Les Augustins Photographie",
  onSend,
  showOnlySelected,
  onToggleFilter,
  isLocked,
  submitting,
}: GalleryNavigationProps) {
  const progress = Math.min((selectedCount / targetCount) * 100, 100)
  const isComplete = selectedCount >= targetCount

  return (
    <div className="w-full">
      {/* Brand Header - Scrolled with page */}
      <header className="w-full bg-white px-6 pt-16 pb-12 lg:px-12 border-b border-stone-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 font-serif leading-none">
            {photographerName}
          </h1>
          <p className="text-stone-400 text-sm md:text-lg font-medium tracking-[0.3em] uppercase mt-6">
            {clientName} <span className="mx-3 opacity-30">&bull;</span> Shooting Selection
          </p>
        </div>
      </header>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-10 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          <div className="bg-stone-900/90 backdrop-blur-2xl rounded-3xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-4">

            {/* Left: Filter Toggle */}
            <button
              onClick={onToggleFilter}
              className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all border
                ${showOnlySelected
                  ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-white/10 border-white/5 text-white hover:bg-white/20'}
              `}
              title={showOnlySelected ? "Voir toutes les photos" : "Afficher les favoris"}
            >
              <Icons.Heart />
            </button>

            {/* Center: Progress Info */}
            <div className="flex flex-col flex-1 items-center px-2">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-white text-xl font-bold">{selectedCount}</span>
                <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">/ {targetCount}</span>
                {tolerance > 0 && (
                  <span className="text-white/30 text-xs">(±{tolerance})</span>
                )}
              </div>
              <div className="w-full max-w-[180px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${isComplete ? 'bg-green-500' : 'bg-white'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Right: Main Action Button */}
            {!isLocked && (
              <button
                onClick={onSend}
                disabled={selectedCount === 0 || submitting}
                className={`flex items-center gap-3 px-6 sm:px-10 h-12 sm:h-14 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none
                  ${isComplete ? 'bg-green-500 text-stone-950' : 'bg-white text-stone-950'}
                `}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icons.Send />
                )}
                <span className="tracking-[0.05em] text-xs sm:text-sm uppercase whitespace-nowrap hidden sm:inline">
                  {submitting ? 'Envoi...' : 'Envoyer au photographe'}
                </span>
                <span className="tracking-[0.05em] text-xs uppercase whitespace-nowrap sm:hidden">
                  {submitting ? '...' : 'Envoyer'}
                </span>
              </button>
            )}

            {/* Locked state indicator */}
            {isLocked && (
              <div className="flex items-center gap-3 px-6 sm:px-10 h-12 sm:h-14 rounded-2xl bg-stone-800 text-white/50 border border-white/10">
                <Icons.Lock />
                <span className="tracking-[0.05em] text-xs sm:text-sm uppercase whitespace-nowrap hidden sm:inline">
                  Verrouillé
                </span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
