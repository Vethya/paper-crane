'use client'

import { Button, PrimaryButton } from '../core/Button'
import type { Recovery } from '@/lib/draftRecovery'

interface RecoveryBannerProps {
  recovery: Recovery
  onRestore: () => void
  onDiscard: () => void
}

export function RecoveryBanner({
  recovery,
  onRestore,
  onDiscard
}: RecoveryBannerProps) {
  const time = new Date(recovery.savedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return (
    <div
      role="status"
      className="review-accent-border mb-4 rounded-app-card border p-4 text-sm"
    >
      <p className="review-accent-text font-medium">
        You have unsaved changes from {time}.
      </p>
      {recovery.serverIsNewer && (
        <p className="review-reason mt-1">
          This resume was saved after that, possibly on another device.
          Restoring replaces the saved version.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" className="h-8" onClick={onRestore}>
          Restore
        </PrimaryButton>
        <Button type="button" className="h-8" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  )
}
