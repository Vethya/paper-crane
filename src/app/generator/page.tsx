'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, Suspense, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { Form } from '../../components/generator/Form'
import { Header } from '../../components/generator/Header'
import {
  MobileNav,
  Sidebar,
  sectionLinks
} from '../../components/generator/Sidebar'
import { PrimaryButton } from '../../components/core/Button'
import { ResumesRedirectDialog } from '../../components/generator/ResumesRedirectDialog'
import { ComponentsPanel } from '../../components/generator/ComponentsPanel'
import { AgentTriggerButton } from '../../components/agent/AgentTriggerButton'
import { AgentOverlay } from '../../components/agent/AgentOverlay/index'
import { AgentEditReviewBar } from '../../components/agent/AgentEditReviewBar'
import { authClient } from '../../db/auth-client'
import { agentResumeIdAtom } from '../../atoms/agentAtom'
import { activeSectionSetterAtom } from '../../atoms/activeSection'
import { Blocks } from 'lucide-react'
import type { ResumeComponentType } from '@/lib/resumeComponents'

const Preview = dynamic(
  async () => (await import('../../components/generator/Preview')).Preview,
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
  const urlSection = getValidSection(searchParams.get('section'))
  const [activeSection, setActiveSection] = useState(urlSection)
  const [componentsOpen, setComponentsOpen] = useState(false)
  const [componentsType, setComponentsType] =
    useState<ResumeComponentType>('work')
  const previewRef = useRef<HTMLDivElement>(null)
  const resumeId = searchParams.get('id')
  const { data: session, isPending } = authClient.useSession()
  const showRedirectDialog = !isPending && !!session && !resumeId
  const setAgentResumeId = useSetAtom(agentResumeIdAtom)
  const setActiveSectionSetter = useSetAtom(activeSectionSetterAtom)

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

        {/* Mobile layout (below xl) */}
        <div className="flex flex-col gap-4 px-4 py-6 xl:hidden">
          <MobileNav
            activeSection={activeSection}
            onSectionChange={changeActiveSection}
          />

          {resumeId && (
            <button
              type="button"
              onClick={toggleComponents}
              className="inline-flex items-center justify-center gap-2 rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm font-medium text-white transition hover:bg-app-controlHover"
            >
              <Blocks className="h-4 w-4" />
              Components
            </button>
          )}

          <div className="rounded-app-panel border border-app-border bg-app-surface">
            <Form
              activeSection={activeSection}
              formId="resume-form-mobile"
              onMake={closeComponents}
            />
          </div>

          <div className="flex justify-center">
            <PrimaryButton
              type="submit"
              form="resume-form-mobile"
              className="w-full"
              onClick={() =>
                previewRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              MAKE
            </PrimaryButton>
          </div>

          <div
            ref={previewRef}
            className="flex min-h-[70svh] flex-col rounded-app-panel border border-app-border bg-app-surface"
          >
            <div className="border-b border-app-border px-6 py-4 text-md font-medium tracking-wide text-slate-400">
              Live Preview
            </div>
            <div className="flex flex-1 overflow-hidden">
              <Preview />
            </div>
          </div>
        </div>

        {/* Desktop layout (xl+) */}
        <div className="hidden xl:grid xl:flex-1 xl:auto-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(14rem,15%)_minmax(0,1fr)_minmax(0,51%)] xl:gap-6 xl:overflow-hidden xl:px-8 xl:py-8">
          <div className="min-w-0 rounded-app-panel border border-app-border bg-app-surface p-6">
            <Sidebar
              activeSection={activeSection}
              componentsOpen={componentsOpen}
              onComponentsToggle={toggleComponents}
              onSectionChange={changeActiveSection}
              showComponents={!!resumeId}
              formId="resume-form-desktop"
            />
          </div>

          <div className="rounded-app-panel border border-app-border bg-app-surface xl:overflow-hidden">
            <Form
              activeSection={activeSection}
              formId="resume-form-desktop"
              onMake={closeComponents}
            />
          </div>

          <div className="flex min-h-0 flex-col rounded-app-panel border border-app-border bg-app-surface">
            {componentsOpen && resumeId ? (
              <ComponentsPanel
                activeType={componentsType}
                onActiveTypeChange={setComponentsType}
                onClose={() => setComponentsOpen(false)}
              />
            ) : (
              <>
                <div className="border-b border-app-border px-6 py-4 text-md font-medium tracking-wide text-slate-400">
                  Live Preview
                </div>
                <div className="flex flex-1 overflow-hidden">
                  <Preview />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {componentsOpen && resumeId && (
        <ComponentsPanel
          activeType={componentsType}
          onActiveTypeChange={setComponentsType}
          onClose={() => setComponentsOpen(false)}
          variant="sheet"
        />
      )}

      <ResumesRedirectDialog open={showRedirectDialog} />
      <AgentTriggerButton />
      <AgentOverlay />
      <AgentEditReviewBar />
    </main>
  )
}
