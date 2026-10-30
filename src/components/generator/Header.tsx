'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { FileText, LogOut, Moon, Sun } from 'lucide-react'
import { Logo } from '../core/Logo'
import { LibraryNav } from '../library/LibraryNav'
import { authClient } from '@/db/auth-client'
import { useAtom, useAtomValue } from 'jotai'
import { formDataAtom } from '@/atoms/formData'
import { resumeTitleAtom } from '@/atoms/resume'
import { agentPendingEditsAtom } from '@/atoms/agentEdits'
import { TagPicker } from './TagPicker'
import { useAutoSave } from '@/hooks/useAutoSave'
import {
  applyTheme,
  getStoredTheme,
  type ThemeMode
} from '@/components/theme/ThemeProvider'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface HeaderProps {
  className?: string
  showTags?: boolean
}

export function Header({ className, showTags = true }: HeaderProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const resumeId = searchParams.get('id')
  const formData = useAtomValue(formDataAtom)
  const saveState = useAutoSave(resumeId, formData)
  const reviewing = useAtomValue(agentPendingEditsAtom).some(
    (e) => e.status === 'pending'
  )

  useEffect(() => {
    setTheme(getStoredTheme())

    function handleThemeChange(event: Event) {
      setTheme((event as CustomEvent<ThemeMode>).detail)
    }

    window.addEventListener('themechange', handleThemeChange)
    return () => window.removeEventListener('themechange', handleThemeChange)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await authClient.signOut({
        fetchOptions: { onSuccess: () => router.push('/login') }
      })
    } finally {
      setLoggingOut(false)
    }
  }

  function handleToggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const user = session?.user
  const showLibraryNav = pathname === '/resumes' || pathname === '/components'
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
          'relative flex h-14 w-full items-center justify-between gap-4 border-b px-6',
          className
        )
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link href={session ? '/resumes' : '/'} className="shrink-0">
          <Logo />
        </Link>
        {resumeId && pathname === '/generator' && (
          <>
            <span className="text-slate-500" aria-hidden="true">
              /
            </span>
            <ResumeTitle resumeId={resumeId} />
          </>
        )}
      </div>

      {showLibraryNav && (
        <LibraryNav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex" />
      )}

      <div className="flex items-center gap-3">
        {resumeId && showTags && <TagPicker />}

        {resumeId && <SaveStatus state={saveState} reviewing={reviewing} />}

        {!isPending && (
          <div>
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-app-button border border-transparent bg-transparent px-2 py-1 text-sm text-white transition hover:border-app-controlBorder hover:bg-app-control data-[state=open]:border-app-controlBorder data-[state=open]:bg-app-control focus:outline-none">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name ?? ''}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-white text-app-background flex items-center justify-center text-xs font-semibold">
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
                    className="w-44 rounded-app-card border border-app-controlBorder bg-app-surfaceElevated py-1"
                  >
                    <DropdownMenuItem
                      onClick={handleToggleTheme}
                      className="px-4 py-2.5 text-sm text-slate-300 hover:bg-app-control focus:bg-app-control focus:text-white transition-colors cursor-pointer"
                    >
                      {theme === 'dark' ? (
                        <Sun className="text-slate-400" />
                      ) : (
                        <Moon className="text-slate-400" />
                      )}
                      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/resumes"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-app-control focus:bg-app-control focus:text-white transition-colors cursor-pointer"
                      >
                        <FileText className="text-slate-400" />
                        My Resumes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="px-4 py-2.5 text-sm text-slate-300 hover:bg-app-control focus:bg-app-control focus:text-white transition-colors cursor-pointer"
                    >
                      <LogOut className="text-slate-400" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog
                  open={logoutConfirmOpen}
                  onOpenChange={setLogoutConfirmOpen}
                >
                  <DialogContent
                    showCloseButton={false}
                    className="border border-app-border bg-app-surface text-slate-100 max-w-sm"
                  >
                    <DialogHeader>
                      <DialogTitle className="text-white">Log out?</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        You will need to sign in again to access your resumes.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setLogoutConfirmOpen(false)}
                        disabled={loggingOut}
                        className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm text-white transition hover:bg-app-controlHover disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="rounded-app-button bg-red-600 px-4 py-2 text-sm font-medium text-[rgb(255_255_255)] transition hover:bg-red-500 hover:text-[rgb(255_255_255)] focus:text-[rgb(255_255_255)] disabled:text-[rgb(255_255_255)] disabled:opacity-50"
                      >
                        {loggingOut ? 'Logging out…' : 'Log out'}
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-1.5 text-sm text-white transition-colors hover:border-app-borderStrong hover:bg-app-controlHover"
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

function SaveStatus({
  state,
  reviewing
}: {
  state: ReturnType<typeof useAutoSave>
  reviewing: boolean
}) {
  if (reviewing)
    return (
      <span className="review-accent-text text-xs">
        Saving paused while you review
      </span>
    )
  if (state === 'error')
    return <span className="text-xs text-red-400">Couldn’t save</span>
  if (state === 'saving')
    return <span className="text-xs text-slate-400">Saving…</span>
  if (state === 'saved')
    return <span className="text-xs text-slate-400">Saved</span>
  return null
}

function ResumeTitle({ resumeId }: { resumeId: string }) {
  const [title, setTitle] = useAtom(resumeTitleAtom)
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (draft !== null) inputRef.current?.select()
  }, [draft !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  async function commit() {
    const next = draft?.trim()
    setDraft(null)
    if (!next || next === title) return
    const previous = title
    setTitle(next)
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: next })
    }).catch(() => null)
    if (!res?.ok) setTitle(previous)
  }

  if (draft !== null)
    return (
      <input
        ref={inputRef}
        aria-label="Resume title"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(null)
        }}
        className="h-8 w-64 rounded-md border border-app-borderStrong bg-transparent px-2 text-sm font-medium text-white focus:outline-none"
      />
    )

  return (
    <button
      type="button"
      title="Rename"
      onClick={() => setDraft(title)}
      className="h-8 min-w-0 truncate rounded-md px-2 text-sm font-medium text-white transition-colors hover:bg-app-hover"
    >
      {title || 'Untitled resume'}
    </button>
  )
}
