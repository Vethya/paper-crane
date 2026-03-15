"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiChevronDown } from 'react-icons/fi'
import { Logo } from '../core/Logo'
import { authClient } from '@/db/auth-client'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  const user = session?.user
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      className={twMerge(clsx("w-full h-16 flex justify-between items-center border-b px-6", className))}
      style={{ borderColor: '#374151' }}
    >
      <Link href="/">
        <Logo />
      </Link>

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
                  className="absolute right-0 mt-2 w-44 rounded-lg py-1 z-50"
                  style={{ background: '#1a1a24', border: '1px solid #374151' }}
                >
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
              className="text-sm text-slate-300 border rounded-full px-4 py-1.5 hover:text-white hover:border-slate-400 transition-colors"
              style={{ borderColor: '#4b5563' }}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
