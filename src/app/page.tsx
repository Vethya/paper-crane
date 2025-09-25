'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '../components/core/Logo'
import { PrimaryButton, Button } from '../components/core/Button'

const featureHighlights = [
  {
    title: 'Thoughtful templates',
    description:
      'Pick from curated, battle-tested resume templates designed to pass modern ATS rules while staying easy to read.',
  },
  {
    title: 'Live preview, instant updates',
    description:
      'Edit sections, reorder blocks, and see your PDF-ready resume update in real time as you tweak the details.',
  },
  {
    title: 'Import or start fresh',
    description:
      'Jump-start your workflow by importing JSON Resume data—or clear everything and begin with a clean canvas.',
  },
]

export default function Home() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasSession(!!localStorage.getItem('jsonResume'))
    }
  }, [])

  const startNewSession = () => {
    window.localStorage.clear()
    router.push('/generator')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      // TODO: validate JSON schema using Zod
      const jsonResume = JSON.parse(event.target?.result as string)
      localStorage.setItem('jsonResume', JSON.stringify(jsonResume))
      router.push('/generator')
    })

    if (e.target.files?.[0]) {
      reader.readAsText(e.target.files[0])
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-emerald-600/10 blur-[160px]" />
        <div className="absolute inset-x-0 top-1/3 mx-auto h-32 max-w-4xl rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
          <div className="w-full max-w-5xl text-center">
            <Logo className="mx-auto mb-8 w-[220px] sm:w-[260px] md:w-[300px]" />
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              Craft polished resumes in minutes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
              Resumake helps you focus on your story—not formatting headaches. Choose a template, keep your content organized, and export a resume that looks sharp on every screen.
            </p>

            <div className="mx-auto mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <PrimaryButton
                onClick={startNewSession}
                className="!w-full px-8 py-3 text-base font-medium shadow-[0_15px_45px_-20px_rgba(16,185,129,0.7)] transition hover:shadow-[0_18px_55px_-18px_rgba(16,185,129,0.7)] sm:!w-auto"
              >
                Make New Resume
              </PrimaryButton>

              {hasSession && (
                <Link href="/generator" className="w-full sm:w-auto">
                  <Button className="!w-full border-white/20 px-8 py-3 text-base font-medium text-slate-200 transition hover:border-emerald-400/60 hover:text-emerald-300 sm:!w-auto">
                    Continue Session
                  </Button>
                </Link>
              )}

              <label
                htmlFor="import-json"
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 text-base font-medium text-slate-200 transition hover:border-emerald-400/60 hover:text-emerald-300 hover:shadow-[0_15px_45px_-25px_rgba(16,185,129,0.75)] sm:w-auto"
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/70 group-hover:bg-emerald-300" />
                Import JSON
              </label>
            </div>

            <input
              id="import-json"
              type="file"
              accept="application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="mt-16 grid gap-6 text-left sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
              {featureHighlights.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-emerald-400/40 hover:bg-white/8"
                >
                  <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
                  <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="relative border-t border-white/5 bg-slate-900/70 px-6 py-6 text-xs text-slate-400 backdrop-blur sm:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} Saad Quadri</span>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/about" className="transition hover:text-emerald-300">
                About
              </Link>
              <a
                href="https://github.com/saadq/resumake"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-emerald-300"
              >
                Source
              </a>
              <a
                href="https://github.com/saadq/resumake/issues"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-emerald-300"
              >
                Issues
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
