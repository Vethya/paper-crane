'use client'

import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Form } from '../../components/generator/Form'
import { Header } from '../../components/generator/Header'
import { Sidebar } from '../../components/generator/Sidebar'

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
  const [activePanel, setActivePanel] = useState<'nav' | 'form' | 'preview'>('form')
  const section = useSearchParams().get('section')
  useEffect(() => {
    setActivePanel('form')
  }, [section])

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100 xl:h-screen">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-blue-600/10 via-blue-600/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-16 right-[-12%] h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col xl:min-h-0">
        <Header className="border-b border-white/5 bg-slate-950/80 backdrop-blur" />

        <div className="flex border-b border-white/5 bg-slate-950/80 backdrop-blur xl:hidden">
          {(['nav', 'form', 'preview'] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={clsx(
                "flex-1 py-3 text-sm font-medium capitalize transition-colors",
                activePanel === panel
                  ? "border-b-2 border-blue-600 text-blue-500"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {panel === 'nav' ? 'Nav' : panel === 'preview' ? 'Preview' : 'Form'}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden px-4 py-8 xl:auto-rows-[minmax(0,1fr)] xl:grid-cols-[15%_minmax(0,1fr)_51%] xl:px-8">
          <div className={clsx("rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur", activePanel !== 'nav' ? "hidden xl:block" : "block")}>
            <Suspense fallback={<div className="text-sm text-slate-400">Loading sidebar...</div>}>
              <Sidebar />
            </Suspense>
          </div>

          <div className={clsx("rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur xl:overflow-hidden", activePanel !== 'form' ? "hidden xl:block" : "block")}>
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading form...</div>}>
              <Form />
            </Suspense>
          </div>

          <div className={clsx("flex-col rounded-3xl border border-blue-600/15 bg-slate-950/60 backdrop-blur", activePanel !== 'preview' ? "hidden xl:flex" : "flex")}>
            <div className="border-b border-blue-600/10 px-6 py-4 text-sm font-medium uppercase tracking-[0.12em] text-blue-400/80">
              Live preview
            </div>
            <div className="flex flex-1 overflow-hidden">
              <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-slate-400">Loading preview...</div>}>
                <Preview />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
