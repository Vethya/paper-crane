'use client'

import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { useAtom, useSetAtom } from 'jotai'
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

const initialFormValues: FormValues = {
  headings: {},
  sections: ['profile', 'education', 'work', 'skills', 'projects', 'awards'],
  selectedTemplate: 1
}

interface FormProps {
  className?: string
  activeSection?: string
}

export function Form({ className, activeSection = 'basics' }: FormProps) {
  const searchParams = useSearchParams()
  const currSection = activeSection
  const resumeId = searchParams.get('id')

  const [resume, setResume] = useAtom(resumeAtom)
  const [, setFormData] = useAtom(formDataAtom)
  const [, setResumeTags] = useAtom(resumeTagsAtom)
  const [isLoadingResume, setIsLoadingResume] = useAtom(isLoadingResumeAtom)
  const setFormSetValue = useSetAtom(formSetValueAtom)
  const formContext = useForm<FormValues>({ defaultValues: initialFormValues })

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
  }, [resumeId, formContext, setFormData, setResumeTags, setIsLoadingResume])

  // Register setValue so the agent edit system can apply / restore values from outside the form
  useEffect(() => {
    setFormSetValue(() => formContext.setValue)
    return () => setFormSetValue(null)
  }, [setFormSetValue, formContext.setValue])

  const handleFormSubmit = useCallback(async () => {
    const formValues = formContext.getValues()
    setResume({ ...resume, isLoading: true })
    try {
      const newResumeUrl = await generateResume(formValues)
      setResume({ ...resume, url: newResumeUrl, isLoading: false })
    } catch (error) {
      console.error(error)
      setResume({ ...resume, isError: true, isLoading: false })
    }
  }, [formContext, resume, setResume])

  return (
    <FormProvider {...formContext}>
      <form
        className={twMerge(clsx("overflow-auto xl:h-full", className))}
        id="resume-form"
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
