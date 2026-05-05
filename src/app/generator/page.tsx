'use client'

import dynamic from 'next/dynamic'
import {
  useRef,
  useState,
  Suspense,
  useEffect,
  useCallback
} from 'react'
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
import { AgentTriggerButton } from '../../components/agent/AgentTriggerButton'
import { AgentOverlay } from '../../components/agent/AgentOverlay/index'
import { AgentEditReviewBar } from '../../components/agent/AgentEditReviewBar'
import { authClient } from '../../db/auth-client'
import { agentResumeIdAtom } from '../../atoms/agentAtom'
import { activeSectionSetterAtom } from '../../atoms/activeSection'

const Preview = dynamic(
  async () => (await import('../../components/generator/Preview')).Preview,
  { ssr: false }
)

const DEFAULT_SECTION = 'basics'
const validSections = new Set(sectionLinks.map(({ section }) => section))

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

          <div className="rounded-app-panel border border-app-border bg-app-surface">
            <Form activeSection={activeSection} formId="resume-form-mobile" />
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
              onSectionChange={changeActiveSection}
              formId="resume-form-desktop"
            />
          </div>

          <div className="rounded-app-panel border border-app-border bg-app-surface xl:overflow-hidden">
            <Form activeSection={activeSection} formId="resume-form-desktop" />
          </div>

          <div className="flex flex-col rounded-app-panel border border-app-border bg-app-surface">
            <div className="border-b border-app-border px-6 py-4 text-md font-medium tracking-wide text-slate-400">
              Live Preview
            </div>
            <div className="flex flex-1 overflow-hidden">
              <Preview />
            </div>
          </div>
        </div>
      </div>

      <ResumesRedirectDialog open={showRedirectDialog} />
      <AgentTriggerButton />
      <AgentOverlay />
      <AgentEditReviewBar />
    </main>
  )
}
