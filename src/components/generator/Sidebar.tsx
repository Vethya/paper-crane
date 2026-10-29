'use client'

import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAtomValue } from 'jotai'
import { Blocks } from 'lucide-react'
import { PrimaryButton } from '../core/Button'
import { isLoadingResumeAtom } from '@/atoms/resume'
import { useIsHydrated } from '@/hooks/useIsHydrated'

export const sectionLinks = [
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
  componentsOpen?: boolean
  onComponentsToggle?: () => void
  onSectionChange: (section: string) => void
  showComponents?: boolean
  formId?: string
}

export function Sidebar({
  activeSection,
  componentsOpen = false,
  onComponentsToggle,
  onSectionChange,
  showComponents = false,
  formId = 'resume-form'
}: SidebarProps) {
  const isLoadingResume = useAtomValue(isLoadingResumeAtom)
  const isHydrated = useIsHydrated()

  return (
    <aside className="min-w-0">
      <nav className="mb-7 flex w-full min-w-0 flex-col items-start justify-center gap-3">
        {sectionLinks.map(({ label, section }) => (
          <button
            key={section}
            type="button"
            onClick={() => onSectionChange(section)}
            className={twMerge(
              clsx(
                'w-full max-w-full rounded-app-button border px-3 py-2 text-left text-sm font-medium leading-snug transition-colors',
                activeSection === section
                  ? 'border-white/35 bg-white/[0.18] text-white'
                  : 'border-transparent bg-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
              )
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {showComponents && (
        <button
          type="button"
          onClick={onComponentsToggle}
          className={twMerge(
            clsx(
              'mb-3 flex w-full min-w-0 items-center justify-center gap-2 rounded-app-button border px-3 py-2 text-sm font-medium transition-colors',
              componentsOpen
                ? 'border-white/35 bg-white/[0.18] text-white'
                : 'border-app-controlBorder bg-app-control text-slate-200 hover:bg-app-controlHover hover:text-white'
            )
          )}
        >
          <Blocks className="h-4 w-4" />
          Components
        </button>
      )}

      <PrimaryButton
        form={formId}
        disabled={!isHydrated || isLoadingResume}
        className="w-full min-w-0 px-3"
      >
        MAKE
      </PrimaryButton>
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
            'shrink-0 whitespace-nowrap rounded-app-button px-4 py-2 text-sm font-medium transition-colors',
            activeSection === section
              ? 'bg-white text-app-background'
              : 'border border-app-controlBorder bg-app-control text-slate-300 hover:bg-app-controlHover hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
