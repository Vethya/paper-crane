'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const links = [
  { href: '/resumes', label: 'Resumes' },
  { href: '/components', label: 'Components' }
]

export function LibraryNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex justify-center">
      <div className="inline-flex rounded-app-button border border-app-controlBorder bg-app-control p-1">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'rounded-app-button px-4 py-2 text-sm font-medium transition',
                active
                  ? 'bg-white text-app-background'
                  : 'text-slate-300 hover:bg-app-controlHover hover:text-white'
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
