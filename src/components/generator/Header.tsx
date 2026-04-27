'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiCheck, FiChevronDown, FiEdit2, FiX } from 'react-icons/fi'
import { Logo } from '../core/Logo'
import { authClient } from '@/db/auth-client'
import { useAtomValue, useSetAtom } from 'jotai'
import { formDataAtom } from '@/atoms/formData'
import { resumeTitleAtom } from '@/atoms/resumeTitle'
import { saveStateAtom } from '@/atoms/saveState'
import { TagPicker } from './TagPicker'
import { useAutoSave } from '@/hooks/useAutoSave'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  className?: string
  showTags?: boolean
}

export function Header({ className, showTags = true }: HeaderProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('id')
  const formData = useAtomValue(formDataAtom)
  const resumeTitle = useAtomValue(resumeTitleAtom)
  const setResumeTitle = useSetAtom(resumeTitleAtom)
  const setSaveState = useSetAtom(saveStateAtom)
  const saveState = useAutoSave(resumeId, formData)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const displayedTitle = resumeTitle?.trim() || 'Untitled resume'

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(displayedTitle)
    }
  }, [displayedTitle, isEditingTitle])

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [isEditingTitle])

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push('/login') }
    })
  }

  async function handleTitleSave() {
    if (!resumeId) return

    const nextTitle = titleDraft.trim()
    if (!nextTitle) {
      setTitleDraft(displayedTitle)
      setIsEditingTitle(false)
      return
    }

    if (nextTitle === displayedTitle) {
      setIsEditingTitle(false)
      return
    }

    const previousTitle = displayedTitle
    setResumeTitle(nextTitle)
    setIsEditingTitle(false)
    setSaveState('saving')

    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle })
      })

      if (!res.ok) throw new Error()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setResumeTitle(previousTitle)
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2000)
    }
  }

  function handleTitleCancel() {
    setTitleDraft(displayedTitle)
    setIsEditingTitle(false)
  }

  const user = session?.user
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? '?')

  return (
    <header
      className={twMerge(
        clsx(
          'w-full h-16 flex justify-between items-center border-b px-6',
          className
        )
      )}
      style={{ borderColor: '#374151' }}
    >
      <Link href={session ? '/resumes' : '/'}>
        <Logo />
      </Link>

      {resumeId && (
        <div className="mx-4 flex min-w-0 flex-1 justify-center">
          {isEditingTitle ? (
            <div className="flex min-w-0 max-w-md flex-1 items-center gap-1 rounded-full border border-blue-500/50 bg-slate-900/80 px-3 py-1">
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleTitleSave()
                  if (event.key === 'Escape') handleTitleCancel()
                }}
                className="min-w-0 flex-1 bg-transparent text-center text-sm font-medium text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                aria-label="Save resume name"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleTitleSave}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiCheck size={14} />
              </button>
              <button
                type="button"
                aria-label="Cancel resume name edit"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleTitleCancel}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="group flex min-w-0 max-w-md items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
            >
              <span className="truncate">{displayedTitle}</span>
              <FiEdit2
                size={13}
                className="flex-shrink-0 text-slate-500 transition group-hover:text-slate-300"
              />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {resumeId && showTags && user && <TagPicker />}

        {resumeId && saveState === 'saving' && (
          <span className="text-sm text-slate-400">Saving…</span>
        )}
        {resumeId && saveState === 'saved' && (
          <span className="text-sm text-slate-400">Saved</span>
        )}

        {!isPending && (
          <div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-white hover:opacity-80 transition-opacity focus:outline-none">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name ?? ''}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </span>
                    )}
                    <span className="hidden sm:inline text-slate-300">
                      {user.name ?? user.email}
                    </span>
                    <FiChevronDown size={14} className="text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 rounded-lg border border-slate-700 bg-slate-800 py-1"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/resumes"
                      className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 focus:bg-white/5 focus:text-slate-300 transition-colors cursor-pointer"
                    >
                      My Resumes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 focus:bg-white/5 focus:text-slate-300 transition-colors cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
