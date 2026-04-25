'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Form } from '../../components/generator/Form'
import { Header } from '../../components/generator/Header'
import { MobileNav, Sidebar } from '../../components/generator/Sidebar'
import { PrimaryButton } from '../../components/core/Button'
import { ResumesRedirectDialog } from '../../components/generator/ResumesRedirectDialog'
import { authClient } from '../../db/auth-client'

const Preview = dynamic(
  async () => (await import('../../components/generator/Preview')).Preview,
  { ssr: false }
)

export default function GeneratorPage() {
  return (
    <Suspense>
      <GeneratorContent />
    </Suspense>
  )
}

function GeneratorContent() {
  const [activeSection, setActiveSection] = useState('basics')
  const isTemplatesSection = activeSection === 'templates'
  const previewRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('id')
  const { data: session, isPending } = authClient.useSession()
  const showRedirectDialog = !isPending && !!session && !resumeId

  return (
    <main className="relative flex min-h-screen flex-col bg-slate-950 text-slate-100 xl:h-screen xl:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-blue-600/10 via-blue-600/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-16 right-[-12%] h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col xl:min-h-0">
        <Header className="border-b border-white/5 bg-slate-950/80 backdrop-blur z-10" />

        {/* Mobile layout (below xl) */}
        <div className="flex flex-col gap-4 px-4 py-6 xl:hidden">
          <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />

          <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur">
            <Form activeSection={activeSection} />
          </div>

          <div className="flex justify-center">
            <PrimaryButton
              type="submit"
              form="resume-form"
              className="w-full"
              onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              MAKE
            </PrimaryButton>
          </div>

          <div ref={previewRef} className="flex min-h-[70svh] flex-col rounded-3xl border border-blue-600/15 bg-slate-950/60 backdrop-blur">
            <div className="border-b border-blue-600/10 px-6 py-4 text-sm font-medium uppercase tracking-[0.12em] text-blue-400/80">
              Live preview
            </div>
            <div className="flex flex-1 overflow-hidden">
              <Preview />
            </div>
          </div>
        </div>

        {/* Desktop layout (xl+) */}
        <div
          className={
            isTemplatesSection
              ? 'hidden xl:grid xl:flex-1 xl:auto-rows-[minmax(0,1fr)] xl:grid-cols-[15%_minmax(0,1fr)] xl:gap-6 xl:overflow-hidden xl:px-8 xl:py-8'
              : 'hidden xl:grid xl:flex-1 xl:auto-rows-[minmax(0,1fr)] xl:grid-cols-[15%_minmax(0,1fr)_51%] xl:gap-6 xl:overflow-hidden xl:px-8 xl:py-8'
          }
        >
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur">
            <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur xl:overflow-hidden">
            <Form activeSection={activeSection} />
          </div>

          {!isTemplatesSection && (
            <div className="flex flex-col rounded-3xl border border-blue-600/15 bg-slate-950/60 backdrop-blur">
              <div className="border-b border-blue-600/10 px-6 py-4 text-sm font-medium uppercase tracking-[0.12em] text-blue-400/80">
                Live preview
              </div>
              <div className="flex flex-1 overflow-hidden">
                <Preview />
              </div>
            </div>
          )}
        </div>
      </div>

      <ResumesRedirectDialog open={showRedirectDialog} />
    </main>
  )
}
