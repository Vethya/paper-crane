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
import {
  resumeAtom,
  isLoadingResumeAtom,
  markBuiltAtom,
  resumeTitleAtom
} from '../../../atoms/resume'
import { formDataAtom, formSetValueAtom } from '../../../atoms/formData'
import { AgentFieldFocuser } from '../../agent/AgentFieldFocuser'
import { agentPendingEditsAtom } from '../../../atoms/agentEdits'
import { resumeTagsAtom } from '../../../atoms/resumeTags'
import { FormValues } from '../../../types'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

import latex from '../../../lib/latex'
import getTemplateData from '../../../lib/templates'
import { prepareResumeBuild } from '../../../lib/resumeBuild'

async function generateResume(formData: FormValues): Promise<string> {
  const { texDoc, opts } = getTemplateData(formData)
  return latex(texDoc, opts)
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
  controlsExternalUpdates?: boolean
}

export function Form({
  className,
  activeSection = 'basics',
  formId = 'resume-form',
  onMake,
  controlsExternalUpdates = true
}: FormProps) {
  const searchParams = useSearchParams()
  const currSection = activeSection
  const resumeId = searchParams.get('id')

  const [, setResume] = useAtom(resumeAtom)
  const [, setFormData] = useAtom(formDataAtom)
  const [, setResumeTags] = useAtom(resumeTagsAtom)
  const [isLoadingResume, setIsLoadingResume] = useAtom(isLoadingResumeAtom)
  const setFormSetValue = useSetAtom(formSetValueAtom)
  const markBuilt = useSetAtom(markBuiltAtom)
  const setResumeTitle = useSetAtom(resumeTitleAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const formContext = useForm<FormValues>({ defaultValues: initialFormValues })

  const generateAndSetResume = useCallback(
    async (
      formValues: FormValues,
      shouldCommit: () => boolean = () => true
    ) => {
      const buildPayload = prepareResumeBuild(formValues)
      setResume((current) => ({ ...current, isError: false, isLoading: true }))
      try {
        const newResumeUrl = await generateResume(buildPayload)
        if (!shouldCommit()) {
          URL.revokeObjectURL(newResumeUrl)
          return
        }
        markBuilt(buildPayload)
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
    [setResume, markBuilt]
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
          setResumeTitle(data.title ?? '')
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
    setResumeTitle,
    setIsLoadingResume,
    generateAndSetResume
  ])

  // Register setValue so the agent edit system can apply / restore values from outside the form
  useEffect(() => {
    if (!controlsExternalUpdates) return
    setFormSetValue(() => formContext.setValue)
    return () => setFormSetValue(null)
  }, [controlsExternalUpdates, setFormSetValue, formContext.setValue])

  const handleFormSubmit = useCallback(async () => {
    onMake?.()

    const formValues = prepareResumeBuild(formContext.getValues(), pendingEdits)

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
        method="post"
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
