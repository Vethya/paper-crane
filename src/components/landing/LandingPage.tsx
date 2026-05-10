'use client'

import type { CSSProperties, ChangeEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileCheck2, Upload } from 'lucide-react'
import { Logo } from '@/components/core/Logo'
import { THEME_STORAGE_KEY } from '@/components/theme/ThemeProvider'
import {
  aiFeatures,
  atsPoints,
  navItems,
  productFeatures,
  templatePreviews,
  trustItems,
  workflowSteps
} from './landingData'
import type { IconTextItem } from './landingData'
import { EditorPreview, ProductMockup, TemplateCard } from './Mockups'

const lightLandingVars = {
  '--app-foreground': '15 23 42'
} as CSSProperties

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

export function LandingPage() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    setHasSession(!!localStorage.getItem('jsonResume'))
  }, [])

  const startNewSession = () => {
    const selectedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    window.localStorage.clear()
    if (selectedTheme) {
      window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme)
    }
    router.push('/generator')
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      const jsonResume = JSON.parse(event.target?.result as string)
      localStorage.setItem('jsonResume', JSON.stringify(jsonResume))
      router.push('/generator')
    })

    if (e.target.files?.[0]) {
      reader.readAsText(e.target.files[0])
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-[#0f172a]"
      style={lightLandingVars}
    >
      <LandingHeader onStartNewSession={startNewSession} />

      <main>
        <HeroSection
          hasSession={hasSession}
          onFileUpload={handleFileUpload}
          onStartNewSession={startNewSession}
        />
        <AiSection />
        <AtsSection />
        <WorkflowSection onStartNewSession={startNewSession} />
        <ProductSection />
        <TemplatesSection />
        <FinalCtaSection
          onFileUpload={handleFileUpload}
          onStartNewSession={startNewSession}
        />
      </main>

      <LandingFooter onStartNewSession={startNewSession} />
    </div>
  )
}

function LandingHeader({
  onStartNewSession
}: {
  onStartNewSession: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[#ffffff]/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Resume Manager home" className="flex-none">
          <Logo />
        </Link>

        <div className="hidden items-center gap-4 text-sm text-[#64748b] lg:flex xl:gap-7">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => handleLandingNavClick(event, item.href)}
              className="whitespace-nowrap transition hover:text-[#0f172a]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] lg:inline-flex"
          >
            Sign in
          </Link>
          <PrimaryButton onClick={onStartNewSession} compact>
            Start a resume
          </PrimaryButton>
        </div>
      </nav>
    </header>
  )
}

function HeroSection({
  hasSession,
  onFileUpload,
  onStartNewSession
}: {
  hasSession: boolean
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onStartNewSession: () => void
}) {
  return (
    <section className="relative border-b border-[#e2e8f0] bg-[#f8fafc]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[92rem] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-20">
        <div className="max-w-[46rem]">
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-[#0f172a] sm:text-6xl lg:text-7xl">
            Build an ATS-ready resume with an AI assistant beside you
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
            Resume Manager helps you write, tailor, and export polished resumes
            that are structured for applicant tracking systems and sharpened
            with AI feedback before you send them.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton onClick={onStartNewSession}>
              Start your resume
            </PrimaryButton>
            <ImportButton inputId="import-json" />
            {hasSession && (
              <SecondaryLink href="/generator">Continue session</SecondaryLink>
            )}
          </div>

          <FileInput id="import-json" onChange={onFileUpload} />

          <div className="mt-9 grid max-w-2xl grid-cols-1 gap-3 text-sm text-[#334155] sm:grid-cols-3">
            {trustItems.map((item) => (
              <TrustItem key={item.label} item={item} />
            ))}
          </div>
        </div>

        <ProductMockup />
      </div>
    </section>
  )
}

function AiSection() {
  return (
    <LandingSection id="ai" background="white">
      <SectionIntro
        eyebrow="AI assistant"
        title="An AI resume partner, not just a template picker"
        description="Use AI where it helps most: finding weak claims, tailoring for the role, and turning experience into clear proof."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <article
              key={feature.title}
              className="rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm shadow-slate-200/70 transition hover:border-[#93c5fd] hover:shadow-md"
            >
              <Icon className="h-5 w-5 text-[#2563eb]" />
              <h3 className="mt-5 text-base font-semibold text-[#0f172a]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                {feature.description}
              </p>
            </article>
          )
        })}
      </div>
    </LandingSection>
  )
}

function AtsSection() {
  return (
    <section
      id="ats"
      className="scroll-mt-16 border-b border-[#e2e8f0] bg-[#f8fafc]"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <SectionIntro
          eyebrow="ATS-ready resumes"
          title="Built for clean parsing and real human review"
          description="Resume Manager is built to produce ATS-friendly resumes with clean structure, readable templates, and role-relevant keyword coverage guided by AI."
          accent="green"
        />

        <div className="grid gap-3">
          {atsPoints.map((point) => {
            const Icon = point.icon
            return (
              <div
                key={point.label}
                className="flex gap-3 rounded-lg border border-[#dbeafe] bg-[#ffffff] p-4 shadow-sm shadow-slate-200/70"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#ecfdf5] text-[#059669]">
                  <Icon size={15} />
                </span>
                <p className="text-sm leading-6 text-[#334155]">
                  {point.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function WorkflowSection({
  onStartNewSession
}: {
  onStartNewSession: () => void
}) {
  return (
    <LandingSection id="workflow" background="white">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionIntro
          eyebrow="Workflow"
          title="From draft to tailored PDF in one focused flow"
        />
        <button
          onClick={onStartNewSession}
          className="inline-flex h-11 w-fit flex-none items-center gap-2 whitespace-nowrap rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-5 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#dbeafe]"
        >
          Try the workflow
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {workflowSteps.map((step) => (
          <article
            key={step.step}
            className="rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm shadow-slate-200/70"
          >
            <span className="text-sm font-semibold text-[#2563eb]">
              {step.step}
            </span>
            <h3 className="mt-5 text-xl font-semibold text-[#0f172a]">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </LandingSection>
  )
}

function ProductSection() {
  return (
    <LandingSection background="muted">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionIntro
            eyebrow="Product"
            title="Edit, preview, and improve without losing context"
            description="The workspace keeps the form, rendered resume, and AI assistant close together, so feedback turns into practical edits instead of another disconnected checklist."
          />

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {productFeatures.map((feature) => (
              <FeatureRow key={feature.label} item={feature} />
            ))}
          </div>
        </div>

        <EditorPreview />
      </div>
    </LandingSection>
  )
}

function TemplatesSection() {
  return (
    <LandingSection id="templates" background="white">
      <SectionIntro
        eyebrow="Templates"
        title="Readable layouts. Clean hierarchy. No design gimmicks."
        accent="green"
      />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {templatePreviews.map((template) => (
          <TemplateCard key={template} name={template} />
        ))}
      </div>
    </LandingSection>
  )
}

function FinalCtaSection({
  onFileUpload,
  onStartNewSession
}: {
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onStartNewSession: () => void
}) {
  return (
    <section className="bg-[#f8fafc]">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
        <FileCheck2 className="mx-auto h-9 w-9 text-[#2563eb]" />
        <h2 className="mt-5 text-3xl font-semibold tracking-normal text-[#0f172a] sm:text-4xl">
          Make a resume that reads well to recruiters and parses cleanly for ATS
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#64748b]">
          Start from scratch, import your JSON Resume, or use AI to sharpen what
          you already have.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <PrimaryButton onClick={onStartNewSession}>
            Start a resume
          </PrimaryButton>
          <ImportButton inputId="import-json-bottom" />
          <FileInput id="import-json-bottom" onChange={onFileUpload} />
        </div>
      </div>
    </section>
  )
}

function LandingFooter({
  onStartNewSession
}: {
  onStartNewSession: () => void
}) {
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#ffffff]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
        <div className="max-w-md">
          <Link
            href="/"
            aria-label="Resume Manager home"
            className="inline-flex text-xl font-semibold tracking-normal"
          >
            <span className="text-[#0f172a]">Resume&nbsp;</span>
            <span className="text-[#2563eb]">Manager</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-[#64748b]">
            Build ATS-ready resumes, tailor them with AI feedback, and export
            polished PDFs from one focused workspace.
          </p>
          <button
            onClick={onStartNewSession}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-[#ffffff] shadow-lg shadow-blue-700/20 transition hover:bg-[#1d4ed8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]"
          >
            Start a resume
            <ArrowRight size={16} />
          </button>
        </div>

        <FooterLinkGroup title="Explore">
          {navItems.map((item) => (
            <FooterAnchor key={item.href} href={item.href}>
              {item.label}
            </FooterAnchor>
          ))}
        </FooterLinkGroup>

        <FooterLinkGroup title="Product">
          <FooterAnchor href="/login">Sign in</FooterAnchor>
          <FooterAnchor href="/resumes">Resume library</FooterAnchor>
          <FooterAnchor href="/generator">Resume builder</FooterAnchor>
        </FooterLinkGroup>

        <div className="flex flex-col justify-between gap-3 border-t border-[#e2e8f0] pt-5 text-sm text-[#64748b] sm:flex-row lg:col-span-3">
          <span>© {new Date().getFullYear()} Resume Manager</span>
          <span>ATS-ready resumes with AI-assisted tailoring</span>
        </div>
      </div>
    </footer>
  )
}

function LandingSection({
  children,
  background,
  id
}: {
  children: ReactNode
  background: 'muted' | 'white'
  id?: string
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 border-b border-[#e2e8f0] ${
        background === 'white' ? 'bg-[#ffffff]' : 'bg-[#f8fafc]'
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">{children}</div>
    </section>
  )
}

function FooterLinkGroup({
  children,
  title
}: {
  children: ReactNode
  title: string
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
      <div className="mt-4 flex flex-col items-start gap-3 text-sm text-[#64748b]">
        {children}
      </div>
    </div>
  )
}

function FooterAnchor({
  children,
  href
}: {
  children: ReactNode
  href: string
}) {
  return (
    <Link href={href} className="transition hover:text-[#0f172a]">
      {children}
    </Link>
  )
}

function SectionIntro({
  accent = 'blue',
  description,
  eyebrow,
  title
}: {
  accent?: 'blue' | 'green'
  description?: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="max-w-2xl">
      <p
        className={`text-sm font-semibold uppercase tracking-[0.16em] ${
          accent === 'green' ? 'text-[#059669]' : 'text-[#2563eb]'
        }`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[#0f172a] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-[#64748b]">{description}</p>
      )}
    </div>
  )
}

function PrimaryButton({
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-sm font-semibold text-[#ffffff] shadow-lg shadow-blue-700/20 transition hover:bg-[#1d4ed8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] ${
        compact ? 'h-10 px-3 lg:px-4' : 'h-12 px-6'
      }`}
    >
      {children}
      <ArrowRight size={compact ? 16 : 17} />
    </button>
  )
}

function ImportButton({ inputId }: { inputId: string }) {
  return (
    <label
      htmlFor={inputId}
      className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#cbd5e1] bg-[#ffffff] px-6 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
    >
      <Upload size={17} />
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
      className="inline-flex h-12 items-center justify-center rounded-lg border border-[#cbd5e1] bg-[#ffffff] px-6 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:border-[#94a3b8] hover:bg-[#f8fafc]"
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

function TrustItem({ item }: { item: IconTextItem }) {
  const Icon = item.icon

  return (
    <div className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[#dbeafe] bg-[#ffffff]/85 px-4 py-3 shadow-sm shadow-slate-200/60">
      <Icon size={16} className="flex-none text-[#059669]" />
      <span className="whitespace-nowrap">{item.label}</span>
    </div>
  )
}

function FeatureRow({ item }: { item: IconTextItem }) {
  const Icon = item.icon

  return (
    <div className="flex items-center gap-3 text-sm text-[#334155]">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#eff6ff] text-[#2563eb]">
        <Icon size={14} />
      </span>
      {item.label}
    </div>
  )
}
