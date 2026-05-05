'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '../components/core/Logo'
import { PrimaryButton, Button } from '../components/core/Button'
import { THEME_STORAGE_KEY } from '@/components/theme/ThemeProvider'

const featureHighlights = [
  {
    title: 'Thoughtful templates',
    description:
      'Pick from curated, battle-tested resume templates designed to pass modern ATS rules while staying easy to read.'
  },
  {
    title: 'Live preview, instant updates',
    description:
      'Edit sections, reorder blocks, and see your PDF-ready resume update in real time as you tweak the details.'
  },
  {
    title: 'Import or start fresh',
    description:
      'Jump-start your workflow by importing JSON Resume data—or clear everything and begin with a clean canvas.'
  }
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
    const selectedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    window.localStorage.clear()
    if (selectedTheme)
      window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme)
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
    <div className="relative min-h-screen overflow-hidden bg-app-background text-slate-100">
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
          <div className="w-full max-w-5xl text-center">
            <Logo className="mx-auto mb-8 w-[220px] sm:w-[260px] md:w-[300px]" />
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              Craft polished resumes in minutes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
              Resume Manager helps you focus on your story—not formatting
              headaches. Choose a template, keep your content organized, and
              export a resume that looks sharp on every screen.
            </p>

            <div className="mx-auto mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <PrimaryButton
                onClick={startNewSession}
                className="!w-full px-8 py-3 text-base font-medium sm:!w-auto"
              >
                Make New Resume
              </PrimaryButton>

              {hasSession && (
                <Link href="/generator" className="w-full sm:w-auto">
                  <Button className="!w-full px-8 py-3 text-base font-medium sm:!w-auto">
                    Continue Session
                  </Button>
                </Link>
              )}

              <label
                htmlFor="import-json"
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-app-button border border-app-controlBorder bg-app-control px-8 py-3 text-base font-medium text-white transition hover:border-app-borderStrong hover:bg-app-controlHover sm:w-auto"
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-white/70 group-hover:bg-white" />
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
                  className="rounded-app-card border border-app-border bg-app-surface p-6 transition hover:border-app-borderStrong hover:bg-app-surfaceElevated"
                >
                  <h2 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="relative border-t border-app-border bg-app-surface px-6 py-6 text-xs text-slate-400 sm:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} Resume Manager</span>
            <div className="flex flex-wrap items-center gap-4"></div>
          </div>
        </footer>
      </div>
    </div>
  )
}
