'use client'

import type { CSSProperties, ChangeEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Star, Upload } from 'lucide-react'
import { z } from 'zod'
import { Logo } from '@/components/core/Logo'
import { formatStarCount, GITHUB_REPO_URL } from '@/lib/github'
import {
  atsExtractedText,
  navItems,
  howItWorksSteps,
  templatePreviews
} from './landingData'

const lightLandingVars = {
  '--app-foreground': '24 24 27'
} as CSSProperties

const resumeImportSchema = z
  .object({
    basics: z.object({}).passthrough().optional(),
    work: z.array(z.object({}).passthrough()).optional(),
    education: z.array(z.object({}).passthrough()).optional(),
    awards: z.array(z.object({}).passthrough()).optional(),
    skills: z.array(z.object({}).passthrough()).optional(),
    projects: z.array(z.object({}).passthrough()).optional(),
    headings: z.record(z.string(), z.string()).optional(),
    sections: z
      .array(
        z.enum(['profile', 'education', 'work', 'skills', 'projects', 'awards'])
      )
      .optional(),
    selectedTemplate: z.number().optional()
  })
  .passthrough()
  .refine(
    (resume) =>
      [
        'basics',
        'work',
        'education',
        'awards',
        'skills',
        'projects',
        'headings',
        'sections',
        'selectedTemplate'
      ].some((key) => key in resume),
    'Resume JSON must include at least one supported resume field.'
  )

function handleLandingNavClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string
) {
  if (!href.startsWith('#')) {
    return
  }

  const target = document.querySelector(href)
  if (!(target instanceof HTMLElement)) {
    return
  }

  event.preventDefault()

  window.history.pushState(null, '', href)
  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start'
  })
}

export function LandingPage({ githubStars }: { githubStars: number | null }) {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    setHasSession(!!localStorage.getItem('jsonResume'))
  }, [])

  const startNewSession = () => {
    window.localStorage.removeItem('jsonResume')
    router.push('/generator')
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      try {
        const jsonResume = resumeImportSchema.parse(
          JSON.parse(event.target?.result as string)
        )
        localStorage.setItem('jsonResume', JSON.stringify(jsonResume))
        setImportError(null)
        router.push('/generator')
      } catch {
        setImportError(
          'Upload a valid JSON Resume file with resume fields such as basics, work, education, skills, projects, or awards.'
        )
      } finally {
        e.target.value = ''
      }
    })
    reader.addEventListener('error', () => {
      setImportError('Unable to read that file. Please try another JSON file.')
      e.target.value = ''
    })

    reader.readAsText(file)
  }

  return (
    <div
      className="min-h-screen bg-[#fafaf8] text-[#18181b]"
      style={lightLandingVars}
    >
      <LandingHeader
        githubStars={githubStars}
        onStartNewSession={startNewSession}
      />

      <main>
        <HeroSection
          hasSession={hasSession}
          importError={importError}
          onFileUpload={handleFileUpload}
          onStartNewSession={startNewSession}
        />
        <HowItWorksSection />
        <AtsSection />
        <TemplatesSection />
        <FinalCtaSection
          importError={importError}
          onFileUpload={handleFileUpload}
          onStartNewSession={startNewSession}
        />
      </main>

      <LandingFooter />
    </div>
  )
}

function LandingHeader({
  githubStars,
  onStartNewSession
}: {
  githubStars: number | null
  onStartNewSession: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e4e4e0] bg-[#fafaf8]/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" aria-label="Resume Manager home" className="flex-none">
          <Logo scale={0.85} />
        </Link>

        <div className="hidden items-center gap-7 text-sm text-[#71717a] lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => handleLandingNavClick(event, item.href)}
              className="whitespace-nowrap transition hover:text-[#18181b]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <GithubBadge stars={githubStars} />
          <Link
            href="/login"
            className="hidden whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-[#52525b] transition hover:text-[#18181b] lg:inline-flex"
          >
            Sign in
          </Link>
          <LandingPrimaryButton onClick={onStartNewSession} compact>
            Make my resume
          </LandingPrimaryButton>
        </div>
      </nav>
    </header>
  )
}

function GithubBadge({ stars }: { stars: number | null }) {
  const starLabel =
    stars === null ? '' : `, ${stars} ${stars === 1 ? 'star' : 'stars'}`

  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Resume Manager on GitHub${starLabel}`}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e4e4e0] px-3 text-sm font-medium text-[#18181b] transition hover:border-[#a1a1aa]"
    >
      <GithubMark />
      {stars !== null && (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star size={13} aria-hidden="true" />
          {formatStarCount(stars)}
        </span>
      )}
    </a>
  )
}

function GithubMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function HeroSection({
  hasSession,
  importError,
  onFileUpload,
  onStartNewSession
}: {
  hasSession: boolean
  importError: string | null
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onStartNewSession: () => void
}) {
  return (
    <section className="border-b border-[#e4e4e0]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-8 lg:pt-24">
        <h1 className="max-w-4xl [text-wrap:balance] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[#18181b] sm:text-6xl lg:text-7xl">
          Beautiful resumes that get past the hiring filters.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#71717a]">
          Fill in your details, pick a design, and download a polished PDF. No
          design skills needed.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LandingPrimaryButton onClick={onStartNewSession}>
            Make my resume
          </LandingPrimaryButton>
          <ImportButton inputId="import-json" />
          {hasSession && (
            <SecondaryLink href="/generator">Continue session</SecondaryLink>
          )}
        </div>

        <FileInput id="import-json" onChange={onFileUpload} />
        {importError && <ImportErrorMessage>{importError}</ImportErrorMessage>}

        <Screenshot
          src="/landing/hero-builder.png"
          alt="The Resume Manager builder with the form beside a rendered PDF preview"
          width={1600}
          height={1000}
          className="mt-14"
          priority
        />
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-b border-[#e4e4e0]"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <SectionTitle>How it works</SectionTitle>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <li key={step.title} className="border-t border-[#18181b] pt-5">
              <span className="text-sm font-medium tabular-nums text-[#71717a]">
                {index + 1}
              </span>
              <h3 className="mt-3 text-xl font-medium text-[#18181b]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#71717a]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function AtsSection() {
  return (
    <section id="ats" className="scroll-mt-16 border-b border-[#e4e4e0]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <SectionTitle>
          Designed for recruiters. Readable by software.
        </SectionTitle>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#71717a]">
          Many companies use software to scan resumes before a person sees them.
          Here&apos;s your resume as a recruiter sees it, and as that software
          reads it.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <figure className="min-w-0">
            <figcaption className="mb-3 text-sm font-medium text-[#18181b]">
              What a recruiter sees
            </figcaption>
            <Image
              src="/landing/ats-resume.png"
              alt="A one-page resume for a fictional software engineer"
              width={1241}
              height={1754}
              sizes="(min-width: 1024px) 408px, 100vw"
              className="h-auto w-full border border-[#e4e4e0] bg-[#ffffff]"
            />
          </figure>
          <figure className="min-w-0">
            <figcaption className="mb-3 text-sm font-medium text-[#18181b]">
              What the software reads
            </figcaption>
            <pre className="overflow-x-auto border border-[#e4e4e0] bg-[#f4f4f1] p-5 font-mono text-[11px] leading-5 text-[#27272a]">
              {atsExtractedText}
            </pre>
            <p className="mt-4 text-sm leading-6 text-[#71717a]">
              A real example from this resume. Every company&apos;s software is
              different, so results can vary.
            </p>
          </figure>
        </div>
      </div>
    </section>
  )
}

function TemplatesSection() {
  return (
    <section id="templates" className="scroll-mt-16 border-b border-[#e4e4e0]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <SectionTitle>Nine professional designs</SectionTitle>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#71717a]">
          Pick one you like. You can switch anytime without retyping anything.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {templatePreviews.map((template) => (
            <Image
              key={template.id}
              src={template.src}
              alt={`Resume design ${template.id}`}
              width={1700}
              height={2200}
              sizes="(min-width: 1024px) 350px, 50vw"
              className="h-auto w-full border border-[#e4e4e0] bg-[#ffffff]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection({
  importError,
  onFileUpload,
  onStartNewSession
}: {
  importError: string | null
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onStartNewSession: () => void
}) {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <h2 className="max-w-3xl text-4xl font-medium leading-[1.1] tracking-[-0.03em] text-[#18181b] sm:text-5xl">
          Ready to make yours? It&apos;s free.
        </h2>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LandingPrimaryButton onClick={onStartNewSession}>
            Make my resume
          </LandingPrimaryButton>
          <ImportButton inputId="import-json-bottom" />
          <FileInput id="import-json-bottom" onChange={onFileUpload} />
        </div>
        {importError && <ImportErrorMessage>{importError}</ImportErrorMessage>}
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#e4e4e0]">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 text-sm text-[#71717a] sm:flex-row sm:px-8">
        <span>© {new Date().getFullYear()} Resume Manager</span>
        <div className="flex flex-wrap gap-5">
          <Link href="/generator" className="transition hover:text-[#18181b]">
            Resume builder
          </Link>
          <Link href="/resumes" className="transition hover:text-[#18181b]">
            Resume library
          </Link>
          <Link href="/login" className="transition hover:text-[#18181b]">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="max-w-2xl text-3xl font-medium leading-[1.15] tracking-[-0.02em] text-[#18181b] sm:text-4xl">
      {children}
    </h2>
  )
}

function Screenshot({
  alt,
  className = '',
  height,
  priority = false,
  src,
  width
}: {
  alt: string
  className?: string
  height: number
  priority?: boolean
  src: string
  width: number
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(min-width: 1152px) 1088px, 100vw"
      className={`h-auto w-full rounded-lg border border-[#e4e4e0] bg-[#ffffff] ${className}`}
    />
  )
}

function LandingPrimaryButton({
  children,
  compact = false,
  onClick
}: {
  children: ReactNode
  compact?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#18181b] text-sm font-medium text-[#fafaf8] transition hover:bg-[#3f3f46] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a1a1aa] ${
        compact ? 'h-10 px-3' : 'h-12 px-6'
      }`}
    >
      {children}
      {!compact && <ArrowRight size={17} aria-hidden="true" />}
    </button>
  )
}

function ImportButton({ inputId }: { inputId: string }) {
  return (
    <label
      htmlFor={inputId}
      className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#d4d4d0] px-6 text-sm font-medium text-[#18181b] transition hover:border-[#a1a1aa]"
    >
      <Upload size={17} aria-hidden="true" />
      Import JSON
    </label>
  )
}

function SecondaryLink({
  children,
  href
}: {
  children: ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md border border-[#d4d4d0] px-6 text-sm font-medium text-[#18181b] transition hover:border-[#a1a1aa]"
    >
      {children}
    </Link>
  )
}

function FileInput({
  id,
  onChange
}: {
  id: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      id={id}
      type="file"
      accept="application/json"
      onChange={onChange}
      className="hidden"
    />
  )
}

function ImportErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 max-w-2xl text-sm leading-6 text-red-600">
      {children}
    </p>
  )
}
