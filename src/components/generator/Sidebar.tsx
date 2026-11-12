'use client'

import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Blocks, ChevronLeft, ChevronRight } from 'lucide-react'
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

// Room kept clear of an arrow when scrolling a tab into view.
const ARROW_SPACE = 40

export function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateArrows()
    const observer = new ResizeObserver(updateArrows)
    observer.observe(el)
    window.addEventListener('resize', updateArrows)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows])

  useEffect(() => {
    const el = scrollerRef.current
    const tab = tabRefs.current[activeSection]
    if (!el || !tab) return
    const start = tab.offsetLeft - ARROW_SPACE
    const end = tab.offsetLeft + tab.offsetWidth + ARROW_SPACE - el.clientWidth
    if (start < el.scrollLeft) el.scrollTo({ left: start, behavior: 'smooth' })
    else if (end > el.scrollLeft) el.scrollTo({ left: end, behavior: 'smooth' })
  }, [activeSection])

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="relative flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sectionLinks.map(({ label, section }) => (
          <button
            key={section}
            ref={(node) => {
              tabRefs.current[section] = node
            }}
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

      {canScrollLeft && (
        <ScrollArrow direction="left" onClick={() => scrollByPage(-1)} />
      )}
      {canScrollRight && (
        <ScrollArrow direction="right" onClick={() => scrollByPage(1)} />
      )}
    </div>
  )
}

function ScrollArrow({
  direction,
  onClick
}: {
  direction: 'left' | 'right'
  onClick: () => void
}) {
  const isLeft = direction === 'left'
  const Icon = isLeft ? ChevronLeft : ChevronRight

  return (
    <div
      className={clsx(
        'pointer-events-none absolute inset-y-0 flex items-center pb-1',
        isLeft
          ? 'left-0 bg-gradient-to-r from-app-background from-60% to-transparent pr-4'
          : 'right-0 bg-gradient-to-l from-app-background from-60% to-transparent pl-4'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Scroll sections ${direction}`}
        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-app-hover hover:text-white"
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  )
}
