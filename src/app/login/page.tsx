"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { authClient } from '@/db/auth-client'
import { Logo } from '@/components/core/Logo'
import { StyledInput } from '@/components/core/Input'
import { PrimaryButton, Button } from '@/components/core/Button'

type Tab = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const [tab, setTab] = useState<Tab>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPending && session) {
      router.replace('/generator')
    }
  }, [session, isPending, router])

  if (isPending) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signin') {
        const result = await authClient.signIn.email({ email, password, callbackURL: '/generator' })
        if (result.error) setError(result.error.message ?? 'Sign in failed')
      } else {
        const result = await authClient.signUp.email({ name, email, password, callbackURL: '/generator' })
        if (result.error) setError(result.error.message ?? 'Sign up failed')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    await authClient.signIn.social({ provider: 'google', callbackURL: '/generator' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo /></Link>
        </div>

        <div className="rounded-2xl border bg-[#121217] p-8" style={{ borderColor: '#374151' }}>
          {/* Tabs */}
          <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid #374151' }}>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'signin' ? 'bg-[#1e1e2a] text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => { setTab('signin'); setError('') }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'signup' ? 'bg-[#1e1e2a] text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => { setTab('signup'); setError('') }}
            >
              Sign Up
            </button>
          </div>

          {/* Google button */}
          <Button
            type="button"
            className="w-full min-w-0 mb-4 gap-2 rounded-lg"
            onClick={handleGoogle}
          >
            <FcGoogle size={18} />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ backgroundColor: '#374151' }} />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#374151' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {tab === 'signup' && (
              <StyledInput
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-lg"
              />
            )}
            <StyledInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg"
            />
            <StyledInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full min-w-0 mt-1 rounded-lg disabled:opacity-60"
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  )
}
