'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { authClient } from '@/db/auth-client'
import { Logo } from '@/components/core/Logo'
import { Button } from '@/components/core/Button'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session) {
      router.replace('/generator')
    }
  }, [session, isPending, router])

  if (isPending) return null

  async function handleGoogle() {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/generator'
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app-background px-4">
      <div className="w-full max-w-xs">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="rounded-app-panel border border-app-border bg-app-surface p-8">
          <Button
            type="button"
            className="w-full min-w-0 gap-2 rounded-app-button"
            onClick={handleGoogle}
          >
            <FcGoogle size={18} />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  )
}
