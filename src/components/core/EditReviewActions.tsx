import { Check, RotateCcw, Sparkles } from 'lucide-react'

interface Props {
  reason: string
  onKeep: () => void
  onRestore: () => void
}

// Shown under a field the agent changed: why it changed, and Keep / Restore.
export function EditReviewActions({ reason, onKeep, onRestore }: Props) {
  return (
    <div className="mt-2 flex items-start gap-3">
      <p className="review-reason flex flex-1 items-start gap-1.5 text-xs leading-5">
        <Sparkles className="mt-1 h-3 w-3 shrink-0" aria-hidden="true" />
        {reason}
      </p>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onKeep}
          title="Keep this change"
          className="flex h-7 items-center gap-1 rounded-app-button bg-app-control px-2.5 text-xs font-medium text-white transition-colors hover:bg-app-controlHover"
        >
          <Check className="h-3 w-3" aria-hidden="true" />
          Keep
        </button>
        <button
          type="button"
          onClick={onRestore}
          title="Restore the original value"
          className="flex h-7 items-center gap-1 rounded-app-button px-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-app-control hover:text-white"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Restore
        </button>
      </div>
    </div>
  )
}
