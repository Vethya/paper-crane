'use client'

import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAtomValue } from 'jotai'
import { Blocks } from 'lucide-react'
import { PrimaryButton } from '../core/Button'
import {
  isLoadingResumeAtom,
  isPreviewStaleAtom,
  autoRenderAtom
} from '@/atoms/resume'
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
    <aside className="flex min-w-0 flex-col">
      <nav className="mb-4 flex w-full min-w-0 flex-col items-start justify-center gap-0.5">
        {sectionLinks.map(({ label, section }) => (
          <button
            key={section}
            type="button"
            onClick={() => onSectionChange(section)}
            className={twMerge(
              clsx(
                'w-full max-w-full rounded-app-button px-3 py-2 text-left text-sm font-medium leading-snug transition-colors',
                activeSection === section
                  ? 'bg-app-control text-white'
                  : 'text-slate-400 hover:bg-app-hover hover:text-white'
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
              'mb-4 flex w-full min-w-0 items-center gap-2 rounded-app-button px-3 py-2 text-left text-sm font-medium transition-colors',
              componentsOpen
                ? 'bg-app-control text-white'
                : 'text-slate-400 hover:bg-app-hover hover:text-white'
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
        Render
        <RenderBadge />
      </PrimaryButton>
    </aside>
  )
}

export function RenderBadge() {
  const autoRender = useAtomValue(autoRenderAtom)
  const isStale = useAtomValue(isPreviewStaleAtom)

  if (!autoRender && isStale)
    return (
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
    )
  return null
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
            'shrink-0 whitespace-nowrap rounded-app-button px-3.5 py-2 text-sm font-medium transition-colors',
            activeSection === section
              ? 'bg-app-control text-white'
              : 'text-slate-400 hover:bg-app-hover hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
