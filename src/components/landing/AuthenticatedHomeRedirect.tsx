'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/db/auth-client'

export function AuthenticatedHomeRedirect() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session) {
      router.replace('/resumes')
    }
  }, [session, isPending, router])

  return null
}
