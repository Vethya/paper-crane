'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, Suspense, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { Form } from '../../components/generator/Form'
import { Header } from '../../components/generator/Header'
import {
  MobileNav,
  RenderBadge,
  Sidebar,
  sectionLinks
} from '../../components/generator/Sidebar'
import { PrimaryButton } from '../../components/core/Button'
import { ResumesRedirectDialog } from '../../components/generator/ResumesRedirectDialog'
import { ComponentsPanel } from '../../components/generator/ComponentsPanel'
import { authClient } from '../../db/auth-client'
import { agentResumeIdAtom } from '../../atoms/agentAtom'
import { activeSectionSetterAtom } from '../../atoms/activeSection'
import { Blocks } from 'lucide-react'
import type { ResumeComponentType } from '@/lib/resumeComponents'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { useAiFeaturesEnabled } from '@/hooks/useAiFeaturesEnabled'
import { resumeAtom } from '../../atoms/resume'
import { hasPdfUrlViewers } from '../../lib/pdfBuffer'

const Preview = dynamic(
  async () => (await import('../../components/generator/Preview')).Preview,
  { ssr: false }
)

// Loaded only when AI is on, so the hosted bundle skips the agent code.
const AgentTriggerButton = dynamic(
  async () =>
    (await import('../../components/agent/AgentTriggerButton'))
      .AgentTriggerButton,
  { ssr: false }
)
const AgentSavedEdits = dynamic(
  async () =>
    (await import('../../components/agent/AgentSavedEdits')).AgentSavedEdits,
  { ssr: false }
)
const AgentOverlay = dynamic(
  async () =>
    (await import('../../components/agent/AgentOverlay/index')).AgentOverlay,
  { ssr: false }
)
const AgentEditReviewBar = dynamic(
  async () =>
    (await import('../../components/agent/AgentEditReviewBar'))
      .AgentEditReviewBar,
  { ssr: false }
)

const DEFAULT_SECTION = 'basics'
const validSections = new Set(sectionLinks.map(({ section }) => section))
const componentSectionMap: Partial<Record<string, ResumeComponentType>> = {
  education: 'education',
  work: 'work',
  skills: 'skills',
  projects: 'projects',
  awards: 'awards'
}

function getValidSection(section: string | null) {
  return section && validSections.has(section) ? section : DEFAULT_SECTION
}

export default function GeneratorPage() {
  return (
    <Suspense>
      <GeneratorContent />
    </Suspense>
  )
}

function GeneratorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isHydrated = useIsHydrated()
  const urlSection = getValidSection(searchParams.get('section'))
  const [activeSection, setActiveSection] = useState(urlSection)
  const [componentsOpen, setComponentsOpen] = useState(false)
  const [componentsType, setComponentsType] =
    useState<ResumeComponentType>('work')
  const [isDesktopLayout, setIsDesktopLayout] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const resumeId = searchParams.get('id')
  const { data: session, isPending } = authClient.useSession()
  const showRedirectDialog = !isPending && !!session && !resumeId
  const setAgentResumeId = useSetAtom(agentResumeIdAtom)
  const aiEnabled = useAiFeaturesEnabled()
  const setActiveSectionSetter = useSetAtom(activeSectionSetterAtom)
  const setResume = useSetAtom(resumeAtom)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      queueMicrotask(() => {
        if (mounted.current) return
        setResume((current) =>
          hasPdfUrlViewers(current.url) ? current : { ...current, url: '' }
        )
      })
    }
  }, [setResume])

  const changeActiveSection = useCallback(
    (section: string) => {
      const nextSection = getValidSection(section)
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set('section', nextSection)
      const nextUrl = `${pathname}?${nextParams.toString()}`

      setActiveSection(nextSection)
      router.replace(nextUrl, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const toggleComponents = useCallback(() => {
    setComponentsOpen((open) => {
      const nextOpen = !open
      if (nextOpen) {
        setComponentsType(componentSectionMap[activeSection] ?? 'work')
      }
      return nextOpen
    })
  }, [activeSection])

  const closeComponents = useCallback(() => {
    setComponentsOpen(false)
  }, [])

  useEffect(() => {
    setAgentResumeId(resumeId)
  }, [resumeId, setAgentResumeId])

  useEffect(() => {
    setActiveSectionSetter(() => changeActiveSection)
    return () => setActiveSectionSetter(null)
  }, [changeActiveSection, setActiveSectionSetter])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)')
    const updateLayout = () => setIsDesktopLayout(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener('change', updateLayout)
    return () => mediaQuery.removeEventListener('change', updateLayout)
  }, [])

  useEffect(() => {
    setActiveSection(urlSection)
  }, [urlSection])

  useEffect(() => {
    if (searchParams.get('section') === urlSection) return

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('section', urlSection)
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
  }, [pathname, router, searchParams, urlSection])

  return (
    <main className="relative flex min-h-screen flex-col bg-app-background text-slate-100 xl:h-screen xl:overflow-hidden">
      <div className="relative z-10 flex flex-1 flex-col xl:min-h-0">
        <Header className="z-10 border-b border-app-border bg-app-background/90 backdrop-blur" />

        {/* Keep the form mounted when the layout changes to preserve drafts. */}
        <div
          className={
            isDesktopLayout
              ? 'grid flex-1 auto-rows-[minmax(0,1fr)] grid-cols-[minmax(13rem,14%)_minmax(0,1fr)_minmax(0,50%)] gap-4 overflow-hidden px-6 py-5'
              : 'flex flex-col gap-4 px-4 py-6'
          }
        >
          {isDesktopLayout ? (
            <div className="min-w-0 rounded-app-panel border border-app-border bg-app-surface p-3">
              <Sidebar
                activeSection={activeSection}
                componentsOpen={componentsOpen}
                onComponentsToggle={toggleComponents}
                onSectionChange={changeActiveSection}
                showComponents={!!resumeId}
                formId="resume-form-desktop"
              />
            </div>
          ) : (
            <MobileNav
              activeSection={activeSection}
              onSectionChange={changeActiveSection}
            />
          )}

          {!isDesktopLayout && resumeId && (
            <button
              type="button"
              onClick={toggleComponents}
              className="inline-flex items-center justify-center gap-2 rounded-app-button border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-app-control hover:text-white"
            >
              <Blocks className="h-4 w-4" />
              Components
            </button>
          )}

          <div className="rounded-app-panel border border-app-border bg-app-surface xl:overflow-hidden">
            <Form
              activeSection={activeSection}
              formId={isDesktopLayout ? 'resume-form-desktop' : 'resume-form'}
              onMake={closeComponents}
            />
          </div>

          {!isDesktopLayout && (
            <div className="flex justify-center">
              <PrimaryButton
                type="submit"
                form="resume-form"
                disabled={!isHydrated}
                className="w-full"
                onClick={() =>
                  previewRef.current?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Render
                <RenderBadge />
              </PrimaryButton>
            </div>
          )}

          <div
            ref={previewRef}
            className={`flex flex-col rounded-app-panel border border-app-border bg-app-surface ${isDesktopLayout ? 'min-h-0' : 'min-h-[70svh]'}`}
          >
            {isDesktopLayout && componentsOpen && resumeId ? (
              <ComponentsPanel
                activeType={componentsType}
                onActiveTypeChange={setComponentsType}
                onClose={() => setComponentsOpen(false)}
              />
            ) : (
              <>
                <div className="flex flex-1 overflow-hidden rounded-app-panel">
                  <Preview
                    formId={
                      isDesktopLayout ? 'resume-form-desktop' : 'resume-form'
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!isDesktopLayout && componentsOpen && resumeId && (
        <ComponentsPanel
          activeType={componentsType}
          onActiveTypeChange={setComponentsType}
          onClose={() => setComponentsOpen(false)}
          variant="sheet"
        />
      )}

      <ResumesRedirectDialog open={showRedirectDialog} />
      {aiEnabled && (
        <>
          <AgentTriggerButton />
          <AgentOverlay />
          <AgentEditReviewBar />
          <AgentSavedEdits />
        </>
      )}
    </main>
  )
}
