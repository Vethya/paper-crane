'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MdDragIndicator } from 'react-icons/md'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PrimaryButton, IconButton } from '../core/Button'

interface StyledLinkProps {
  href: string
  $active: boolean
  children: React.ReactNode
}

function StyledLink({ href, $active, children }: StyledLinkProps) {
  return (
    <Link
      href={href}
      className={twMerge(clsx(
        "no-underline font-light text-white",
        $active && "text-green"
      ))}
    >
      {children}
    </Link>
  )
}

export function Sidebar() {
  const searchParams = useSearchParams()
  const currSection = searchParams?.get('section') || 'basics'

  const sectionLinks = [
    { label: 'Templates', section: 'templates' },
    { label: 'Profile', section: 'basics' },
    { label: 'Education', section: 'education' },
    { label: 'Work Experience', section: 'work' },
    { label: 'Skills', section: 'skills' },
    { label: 'Projects', section: 'projects' },
    { label: 'Awards', section: 'awards' }
  ]

  return (
    <aside>
      <nav className="flex flex-col items-start justify-center gap-6 mb-7">
        {sectionLinks.map(({ label, section }) => (
          <div key={section} className="flex gap-2">
            {/* <IconButton type="button" className="cursor-grab">
              <MdDragIndicator />
            </IconButton> */}
            <StyledLink
              href={`/generator?section=${section}`}
              $active={section === currSection}
            >
              {label}
            </StyledLink>
          </div>
        ))}
      </nav>

      <PrimaryButton form="resume-form">MAKE</PrimaryButton>
    </aside>
  )
}
