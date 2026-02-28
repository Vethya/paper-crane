'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Form } from '../../components/generator/Form'
import { Header } from '../../components/generator/Header'
import { Sidebar } from '../../components/generator/Sidebar'

const Preview = dynamic(
  async () => (await import('../../components/generator/Preview')).Preview,
  { ssr: false }
)

export default function GeneratorPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-16 right-[-12%] h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <Header className="border-b border-white/5 bg-slate-950/80 backdrop-blur" />

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden px-4 py-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_500px] xl:px-8">
          <div className="hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur lg:block">
            <Suspense fallback={<div className="text-sm text-slate-400">Loading sidebar...</div>}>
              <Sidebar />
            </Suspense>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur sm:p-6 lg:p-8">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading form...</div>}>
              <Form />
            </Suspense>
          </div>

          <div className="hidden flex-col rounded-3xl border border-emerald-500/15 bg-slate-950/60 backdrop-blur xl:flex">
            <div className="border-b border-emerald-500/10 px-6 py-4 text-sm font-medium uppercase tracking-[0.12em] text-emerald-300/80">
              Live preview
            </div>
            <div className="flex flex-1 overflow-hidden">
              <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-slate-400">Loading preview...</div>}>
                <Preview />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 bg-slate-900/80 px-4 py-4 text-xs text-slate-500 backdrop-blur sm:px-6 lg:hidden">
          <p className="text-center">
            Need the live preview? Open the generator on a larger screen for the full layout.
          </p>
        </div>
      </div>
    </main>
  )
}
