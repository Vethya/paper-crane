"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiChevronDown, FiCheck } from 'react-icons/fi'
import { Logo } from '../core/Logo'
import { authClient } from '@/db/auth-client'
import { useAtomValue } from 'jotai'
import { formDataAtom } from '@/atoms/formData'
import { resumeTagsAtom } from '@/atoms/resumeTags'
import { TagPicker } from './TagPicker'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface HeaderProps {
  className?: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function Header({ className }: HeaderProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('id')
  const formData = useAtomValue(formDataAtom)
  const resumeTags = useAtomValue(resumeTagsAtom)
  const [open, setOpen] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })
  }

  async function handleSave() {
    if (!resumeId || !formData) return
    setSaveState('saving')
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formData, tags: resumeTags }),
      })
      if (!res.ok) throw new Error()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2000)
    }
  }

  const user = session?.user
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      className={twMerge(clsx("w-full h-16 flex justify-between items-center border-b px-6", className))}
      style={{ borderColor: '#374151' }}
    >
      <Link href={session ? "/resumes" : "/"}>
        <Logo />
      </Link>

      <div className="flex items-center gap-3">
        {resumeId && <TagPicker />}

        {resumeId && (
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
              saveState === 'saved'
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : saveState === 'error'
                ? "bg-red-600/20 text-red-400 border border-red-600/30"
                : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
            )}
          >
            {saveState === 'saved' ? (
              <><FiCheck size={13} /> Saved</>
            ) : saveState === 'error' ? (
              "Error"
            ) : saveState === 'saving' ? (
              "Saving…"
            ) : (
              "Save"
            )}
          </button>
        )}

      {!isPending && (
        <div className="relative" ref={dropdownRef}>
          {user ? (
            <>
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-sm text-white hover:opacity-80 transition-opacity focus:outline-none"
              >
                {user.image ? (
                  <img src={user.image} alt={user.name ?? ''} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold">
                    {initials}
                  </span>
                )}
                <span className="hidden sm:inline text-slate-300">{user.name ?? user.email}</span>
                <FiChevronDown size={14} className="text-slate-400" />
              </button>

              {open && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700 bg-slate-800 py-1 z-50"
                >
                  <Link
                    href="/resumes"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    My Resumes
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-slate-300 border border-slate-600 rounded-full px-4 py-1.5 hover:text-white hover:border-slate-400 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      )}
      </div>
    </header>
  )
}
