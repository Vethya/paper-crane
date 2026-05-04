'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { agentOpenAtom } from '../../atoms/agentAtom'
import { agentPendingEditsAtom } from '../../atoms/agentEdits'
import { authClient } from '../../db/auth-client'

export function AgentTriggerButton() {
  const [open, setOpen] = useAtom(agentOpenAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const { data: session } = authClient.useSession()
  const router = useRouter()

  if (open) return null

  const pendingList = pendingEdits.filter((e) => e.status === 'pending')
  if (pendingList.length > 0) return null

  function handleClick() {
    if (!session) {
      router.push('/login')
      return
    }
    setOpen(true)
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-app-surfaceElevated px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_36px_rgba(0,0,0,0.72)] ring-1 ring-black/50 transition hover:border-white/35 hover:bg-[#17171b] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Sparkles className="h-4 w-4 text-white" />
      Resume Agent
    </button>
  )
}
