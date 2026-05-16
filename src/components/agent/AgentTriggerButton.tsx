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
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-app-button border border-slate-200/80 bg-app-surfaceElevated px-5 py-2.5 text-sm font-medium text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.14)] ring-1 ring-black/10 transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:bg-app-surface hover:shadow-[0_18px_44px_rgba(15,23,42,0.26)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/25 dark:text-white dark:shadow-[0_8px_20px_rgba(0,0,0,0.42)] dark:ring-black/50 dark:hover:border-white/35 dark:hover:bg-[rgb(28_28_32)] dark:hover:shadow-[0_18px_44px_rgba(255,255,255,0.22)]"
    >
      <Sparkles className="h-4 w-4 text-slate-900 dark:text-white" />
      Resume Agent
    </button>
  )
}
