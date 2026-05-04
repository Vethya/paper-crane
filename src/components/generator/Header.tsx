'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiChevronDown } from 'react-icons/fi'
import { Logo } from '../core/Logo'
import { authClient } from '@/db/auth-client'
import { useAtomValue } from 'jotai'
import { formDataAtom } from '@/atoms/formData'
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
  const saveState = useAutoSave(resumeId, formData)

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push('/login') }
    })
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
    >
      <Link href={session ? '/resumes' : '/'}>
        <Logo />
      </Link>

      <div className="flex items-center gap-3">
        {resumeId && showTags && <TagPicker />}

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
                  className="w-44 rounded-lg border border-app-border bg-app-surfaceElevated py-1"
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
