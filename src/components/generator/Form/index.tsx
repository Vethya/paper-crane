'use client'

import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Loader2 } from 'lucide-react'
import { TemplatesSection } from './sections/TemplatesSection'
import { ProfileSection } from './sections/ProfileSection'
import { EducationSection } from './sections/EducationSection'
import { WorkSection } from './sections/WorkSection'
import { SkillsSection } from './sections/SkillsSection'
import { AwardSection } from './sections/AwardsSection'
import { ProjectsSection } from './sections/projectsSection'
import { resumeAtom, isLoadingResumeAtom } from '../../../atoms/resume'
import { formDataAtom, formSetValueAtom } from '../../../atoms/formData'
import { AgentFieldFocuser } from '../../agent/AgentFieldFocuser'
import {
  agentPendingEditsAtom,
  type PendingEdit
} from '../../../atoms/agentEdits'
import { resumeTagsAtom } from '../../../atoms/resumeTags'
import { FormValues } from '../../../types'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

import latex from '../../../lib/latex'
import getTemplateData from '../../../lib/templates'

async function generateResume(formData: FormValues): Promise<string> {
  const { texDoc, opts } = getTemplateData(formData)
  return latex(texDoc, opts)
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
) {
  const parts = path.split('.')
  let target: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const idx = Number(key)
    const next =
      !isNaN(idx) && Array.isArray(target) ? target[idx] : target[key]
    target = next as Record<string, unknown>
    if (target == null) return
  }
  target[parts[parts.length - 1]] = value
}

function applyPendingEdits(formValues: FormValues, edits: PendingEdit[]) {
  const vals = formValues as Record<string, unknown>

  for (const edit of edits) {
    if (edit.status !== 'pending') continue

    if (edit.type === 'set') {
      setNestedValue(vals, edit.fieldPath, edit.newValue)
    } else if (edit.type === 'append') {
      const arr = (vals[edit.arrayPath] ?? []) as Record<string, unknown>[]
      const existing = arr.find((e) => e._agentEditId === edit.id)
      if (existing) {
        Object.assign(existing, edit.entry)
      } else {
        arr.push(edit.entry)
        vals[edit.arrayPath] = arr
      }
    }
  }

  // Apply removes last so indices stay valid during set/append passes
  const removeMap = new Map<string, Set<number>>()
  for (const edit of edits) {
    if (edit.type === 'remove' && edit.status === 'pending') {
      if (!removeMap.has(edit.arrayPath))
        removeMap.set(edit.arrayPath, new Set())
      removeMap.get(edit.arrayPath)!.add(edit.entryIndex)
    }
  }
  for (const [arrayPath, indices] of removeMap) {
    const current = (vals[arrayPath] ?? []) as unknown[]
    vals[arrayPath] = current.filter((_, i) => !indices.has(i))
  }
}

const ARRAY_PATHS = [
  'work',
  'education',
  'skills',
  'projects',
  'awards'
] as const

function stripAgentMarkers(formValues: FormValues) {
  const vals = formValues as Record<string, unknown>
  for (const key of ARRAY_PATHS) {
    const arr = vals[key]
    if (!Array.isArray(arr)) continue
    for (const entry of arr) {
      if (entry && typeof entry === 'object')
        delete (entry as Record<string, unknown>)._agentEditId
    }
  }
}

const initialFormValues: FormValues = {
  headings: {},
  sections: ['profile', 'education', 'work', 'skills', 'projects', 'awards'],
  selectedTemplate: 1
}

interface FormProps {
  className?: string
  activeSection?: string
  formId?: string
  onMake?: () => void
}

export function Form({
  className,
  activeSection = 'basics',
  formId = 'resume-form',
  onMake
}: FormProps) {
  const searchParams = useSearchParams()
  const currSection = activeSection
  const resumeId = searchParams.get('id')

  const [, setResume] = useAtom(resumeAtom)
  const [, setFormData] = useAtom(formDataAtom)
  const [, setResumeTags] = useAtom(resumeTagsAtom)
  const [isLoadingResume, setIsLoadingResume] = useAtom(isLoadingResumeAtom)
  const setFormSetValue = useSetAtom(formSetValueAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const formContext = useForm<FormValues>({ defaultValues: initialFormValues })

  const generateAndSetResume = useCallback(
    async (
      formValues: FormValues,
      shouldCommit: () => boolean = () => true
    ) => {
      setResume((current) => ({ ...current, isError: false, isLoading: true }))
      try {
        const newResumeUrl = await generateResume(formValues)
        if (!shouldCommit()) return
        setResume({ url: newResumeUrl, isError: false, isLoading: false })
      } catch (error) {
        if (!shouldCommit()) return
        console.error(error)
        setResume((current) => ({
          ...current,
          isError: true,
          isLoading: false
        }))
      }
    },
    [setResume]
  )

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (resumeId) {
        setIsLoadingResume(true)
        try {
          const res = await fetch(`/api/resumes/${resumeId}`)
          if (!res.ok) return
          const data = await res.json()
          if (cancelled) return
          const content = data.content as FormValues
          formContext.reset(content)
          setFormData(content)
          setResumeTags(data.tags ?? [])
          void generateAndSetResume(content, () => !cancelled)
        } finally {
          if (!cancelled) setIsLoadingResume(false)
        }
      } else {
        const lastSession = localStorage.getItem('jsonResume')
        if (lastSession) {
          const jsonResume = JSON.parse(lastSession) as FormValues
          formContext.reset(jsonResume)
          setFormData(jsonResume)
        } else {
          setFormData(initialFormValues)
        }
      }
    }

    loadData()

    const subscription = formContext.watch((data) => {
      if (!resumeId) {
        localStorage.setItem('jsonResume', JSON.stringify(data))
      }
      setFormData(data as FormValues)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [
    resumeId,
    formContext,
    setFormData,
    setResumeTags,
    setIsLoadingResume,
    generateAndSetResume
  ])

  // Register setValue so the agent edit system can apply / restore values from outside the form
  useEffect(() => {
    setFormSetValue(() => formContext.setValue)
    return () => setFormSetValue(null)
  }, [setFormSetValue, formContext.setValue])

  const handleFormSubmit = useCallback(async () => {
    onMake?.()

    const formValues = structuredClone(formContext.getValues())
    applyPendingEdits(formValues, pendingEdits)
    stripAgentMarkers(formValues)

    await generateAndSetResume(formValues)
  }, [formContext, generateAndSetResume, onMake, pendingEdits])

  return (
    <FormProvider {...formContext}>
      <form
        className={twMerge(
          clsx('overflow-x-hidden overflow-y-auto xl:h-full', className)
        )}
        data-resume-form
        id={formId}
        onSubmit={formContext.handleSubmit(handleFormSubmit)}
      >
        {isLoadingResume ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <AgentFieldFocuser />
            {currSection === 'templates' && <TemplatesSection />}
            {currSection === 'basics' && <ProfileSection />}
            {currSection === 'education' && <EducationSection />}
            {currSection === 'work' && <WorkSection />}
            {currSection === 'skills' && <SkillsSection />}
            {currSection === 'awards' && <AwardSection />}
            {currSection === 'projects' && <ProjectsSection />}
          </>
        )}
      </form>
    </FormProvider>
  )
}
