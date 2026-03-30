'use client'

import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAtomValue } from 'jotai'
import { PrimaryButton } from '../core/Button'
import { isLoadingResumeAtom } from '@/atoms/resume'

const sectionLinks = [
  { label: 'Templates', section: 'templates' },
  { label: 'Profile', section: 'basics' },
  { label: 'Education', section: 'education' },
  { label: 'Work Experience', section: 'work' },
  { label: 'Skills', section: 'skills' },
  { label: 'Projects', section: 'projects' },
  { label: 'Awards', section: 'awards' }
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const isLoadingResume = useAtomValue(isLoadingResumeAtom)

  return (
    <aside>
      <nav className="flex flex-col items-start justify-center gap-6 mb-7">
        {sectionLinks.map(({ label, section }) => (
          <button
            key={section}
            type="button"
            onClick={() => onSectionChange(section)}
            className={twMerge(clsx(
              "font-light text-white text-left",
              activeSection === section && "text-green"
            ))}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex justify-center">
        <PrimaryButton form="resume-form" disabled={isLoadingResume}>MAKE</PrimaryButton>
      </div>
    </aside>
  )
}

interface MobileNavProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sectionLinks.map(({ label, section }) => (
        <button
          key={section}
          type="button"
          onClick={() => onSectionChange(section)}
          className={clsx(
            "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeSection === section
              ? "bg-blue-600 text-white"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
