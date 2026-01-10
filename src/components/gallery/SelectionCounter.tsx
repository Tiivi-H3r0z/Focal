interface SelectionCounterProps {
  selected: number
  target: number
  tolerance: number
  isLocked: boolean
  onSubmit: () => void
  submitting: boolean
}

export default function SelectionCounter({
  selected,
  target,
  tolerance,
  isLocked,
  onSubmit,
  submitting,
}: SelectionCounterProps) {
  const minAllowed = target - tolerance
  const maxAllowed = target + tolerance
  const isOverLimit = selected > maxAllowed
  const isUnderLimit = selected < minAllowed
  const isWithinRange = !isOverLimit && !isUnderLimit && selected > 0

  return (
    <div className="flex items-center space-x-4">
      {/* Counter */}
      <div className="text-right">
        <div
          className={`text-2xl font-bold ${
            isOverLimit
              ? 'text-orange-600'
              : isUnderLimit
              ? 'text-gray-600'
              : isWithinRange
              ? 'text-green-600'
              : 'text-gray-600'
          }`}
        >
          {selected}
        </div>
        <div className="text-xs text-gray-500">
          Target: {target} (±{tolerance})
        </div>
      </div>

      {/* Submit Button */}
      {!isLocked && (
        <button
          onClick={onSubmit}
          disabled={selected === 0 || submitting}
          className={`px-6 py-2 rounded-md font-medium text-white transition-colors ${
            selected === 0 || submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : isWithinRange
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Selection'}
        </button>
      )}

      {/* Warning */}
      {(isOverLimit || isUnderLimit) && selected > 0 && !isLocked && (
        <div className="absolute top-full right-0 mt-2 bg-orange-50 border border-orange-200 rounded-md p-3 shadow-lg max-w-xs">
          <p className="text-xs text-orange-800">
            {isOverLimit
              ? `You've selected ${selected - maxAllowed} photos over the limit. You can still submit, but this may affect pricing.`
              : `You need to select at least ${minAllowed - selected} more photo${minAllowed - selected > 1 ? 's' : ''} to reach the minimum.`}
          </p>
        </div>
      )}
    </div>
  )
}
