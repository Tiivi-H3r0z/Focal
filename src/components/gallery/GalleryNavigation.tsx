'use client'

import { Icons } from './Icons'

interface GalleryNavigationProps {
  selectedCount: number
  targetCount: number
  clientName: string
  photographerName?: string
  onSend: () => void
  showOnlySelected: boolean
  onToggleFilter: () => void
  isLocked: boolean
  submitting: boolean
  isAtLimit: boolean
  gridSize: 'small' | 'medium' | 'large'
  onGridSizeChange: (size: 'small' | 'medium' | 'large') => void
}

export default function GalleryNavigation({
  selectedCount,
  targetCount,
  clientName,
  photographerName = "Les Augustins Photographie",
  onSend,
  showOnlySelected,
  onToggleFilter,
  isLocked,
  submitting,
  isAtLimit,
  gridSize,
  onGridSizeChange,
}: GalleryNavigationProps) {
  const progress = Math.min((selectedCount / targetCount) * 100, 100)
  const isComplete = selectedCount === targetCount

  return (
    <div className="w-full">
      {/* Brand Header - Scrolled with page */}
      <header className="w-full bg-[#0a0a0a] px-6 pt-16 pb-12 lg:px-12 border-b border-stone-900 relative">
        {/* Heart Filter - Top Right */}
        {/* Top Right Controls */}
        <div className="fixed top-8 right-6 lg:right-12 flex items-center justify-end z-40 gap-2 sm:gap-4">

          {/* Grid Size Toggle */}
          <div className="flex items-center gap-1 bg-stone-900/80 border border-stone-800 rounded-full p-1 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => onGridSizeChange('large')}
              title="Grandes miniatures"
              className={`p-2.5 sm:p-3 rounded-full transition-colors ${gridSize === 'large' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'}`}
            >
              <Icons.GridLarge />
            </button>
            <button
              onClick={() => onGridSizeChange('medium')}
              title="Miniatures moyennes"
              className={`p-2.5 sm:p-3 rounded-full transition-colors ${gridSize === 'medium' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'}`}
            >
              <Icons.GridMedium />
            </button>
            <button
              onClick={() => onGridSizeChange('small')}
              title="Petites miniatures"
              className={`p-2.5 sm:p-3 rounded-full transition-colors ${gridSize === 'small' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'}`}
            >
              <Icons.GridSmall />
            </button>
          </div>

          {/* Heart Filter */}
          <button
            onClick={onToggleFilter}
            className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md
              ${showOnlySelected
                ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/40'
                : 'bg-stone-900/80 border-stone-800 text-stone-100 hover:text-rose-500 hover:border-rose-800'}
            `}
          >
            <div className="relative flex items-center justify-center">
              <Icons.Heart solid={showOnlySelected || selectedCount > 0} size={32} />
              {selectedCount > 0 && (
                <span className="absolute text-[11px] font-black tracking-tighter text-white" style={{ top: '48%', transform: 'translateY(-50%)' }}>
                  {selectedCount}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="max-w-screen-2xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white font-serif leading-none">
            {photographerName}
          </h1>
          <p className="text-stone-500 text-sm md:text-lg font-medium tracking-[0.3em] uppercase mt-6">
            {clientName} <span className="mx-3 opacity-30">&bull;</span> Shooting Selection
          </p>
        </div>
      </header>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-10 pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          {/* Progress Info - Large Floating Bar */}
          {!isComplete && (
            <div className="relative h-14 sm:h-16 bg-white/10 backdrop-blur-2xl rounded-2xl overflow-hidden w-full flex items-center justify-center border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in">
              {/* Progress Fill */}
              <div
                className="absolute left-0 top-0 h-full transition-all duration-1000 bg-white"
                style={{ width: `${progress}%` }}
              />
              {/* Progress Text - Large and Readable */}
              <span className="relative z-10 text-xl sm:text-2xl font-black uppercase tracking-[0.1em] text-white mix-blend-difference ml-[0.1em]">
                {selectedCount} <span className="opacity-50 font-light">/</span> <span className="opacity-50">{targetCount}</span>
              </span>
            </div>
          )}

          {/* Action Button - Polished Floating Element */}
          {!isLocked && isComplete && (
            <div className="w-full animate-zoom-in">
              <button
                onClick={onSend}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-4 h-14 sm:h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-sm sm:text-base transition-all transform hover:scale-[1.01] active:scale-[0.98] bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 text-stone-950 shadow-[0_20px_50px_rgba(34,197,94,0.4)]"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-3 border-stone-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icons.Send />
                )}
                <span>
                  {submitting ? 'Envoi en cours...' : 'Envoyer ma sélection'}
                </span>
              </button>
            </div>
          )}

          {/* Locked state indicator */}
          {isLocked && (
            <div className="flex items-center justify-center gap-4 h-14 sm:h-16 rounded-2xl bg-stone-900/90 backdrop-blur-md text-white/50 border border-white/10 w-full">
              <Icons.Lock />
              <span className="tracking-[0.3em] font-black uppercase text-xs sm:text-sm">
                Sélection Verrouillée
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
