import {
  Bot,
  ClipboardCheck,
  Download,
  Eye,
  LayoutTemplate,
  ListTree,
  MessageSquareText,
  Rows3,
  SearchCheck,
  ScanText,
  Tags,
  Target,
  Upload,
  WandSparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type IconTextItem = {
  icon: LucideIcon
  label: string
}

export type LandingCard = {
  icon: LucideIcon
  title: string
  description: string
}

export type WorkflowStep = {
  step: string
  title: string
  description: string
}

export const navItems = [
  { href: '#ai', label: 'AI Tailoring' },
  { href: '#ats', label: 'ATS' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#templates', label: 'Templates' }
]

export const aiFeatures: LandingCard[] = [
  {
    icon: MessageSquareText,
    title: 'Chat with your resume',
    description:
      'Ask what to improve, rewrite weak bullets, or turn scattered notes into crisp experience statements.'
  },
  {
    icon: SearchCheck,
    title: 'Get direct feedback',
    description:
      'Surface vague impact, missing keywords, formatting risks, and sections that need stronger evidence.'
  },
  {
    icon: WandSparkles,
    title: 'Tailor for each role',
    description:
      'Use job descriptions to sharpen positioning, keyword coverage, and the skills that should lead.'
  },
  {
    icon: ClipboardCheck,
    title: 'Approve every change',
    description:
      'Review AI suggestions before they land, so the final resume still sounds like you.'
  }
]

export const workflowSteps: WorkflowStep[] = [
  {
    step: '01',
    title: 'Add or import your resume',
    description:
      'Start with structured fields or bring in JSON Resume data without rebuilding everything manually.'
  },
  {
    step: '02',
    title: 'Use AI to improve and tailor it',
    description:
      'Chat through revisions, tighten bullets, and tune the resume against a specific job description.'
  },
  {
    step: '03',
    title: 'Export a polished PDF',
    description:
      'Choose an ATS-friendly template and export a clean, recruiter-ready document.'
  }
]

export const trustItems: IconTextItem[] = [
  { icon: ScanText, label: 'ATS-friendly format' },
  { icon: Bot, label: 'AI tailoring chat' },
  { icon: Download, label: 'Live PDF export' }
]

export const productFeatures: IconTextItem[] = [
  { icon: Eye, label: 'Live PDF preview' },
  { icon: LayoutTemplate, label: 'ATS-friendly templates' },
  { icon: Bot, label: 'AI resume chat' },
  { icon: Target, label: 'Job-specific tailoring' },
  { icon: MessageSquareText, label: 'Feedback before export' },
  { icon: Upload, label: 'JSON Resume import' },
  { icon: Tags, label: 'Resume library and tags' },
  { icon: Download, label: 'PDF and source export' }
]

export const atsPoints: IconTextItem[] = [
  {
    icon: Rows3,
    label: 'Structured resume fields instead of fragile freeform formatting'
  },
  {
    icon: ListTree,
    label: 'Clean section hierarchy and predictable naming'
  },
  {
    icon: LayoutTemplate,
    label: 'Readable templates built for parsing and recruiter review'
  },
  {
    icon: SearchCheck,
    label: 'AI guidance for relevant keywords and stronger evidence'
  }
]

export const templatePreviews = ['Classic', 'Technical', 'Compact'] as const
