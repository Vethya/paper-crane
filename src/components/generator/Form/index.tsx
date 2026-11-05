'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai'
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
  autoRenderAtom,
  resumeTitleAtom,
  loadedResumeIdAtom
} from '../../../atoms/resume'
import { formDataAtom, formSetValueAtom } from '../../../atoms/formData'
import { AgentFieldFocuser } from '../../agent/AgentFieldFocuser'
import { agentPendingEditsAtom } from '../../../atoms/agentEdits'
import { resumeTagsAtom } from '../../../atoms/resumeTags'
import { FormValues } from '../../../types'
import {
  browserStorage,
  clearDraft,
  findRecovery,
  readDraft,
  type Recovery
} from '../../../lib/draftRecovery'
import { RecoveryBanner } from '../RecoveryBanner'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

import latex, { prewarm } from '../../../lib/latex'
import getTemplateData from '../../../lib/templates'
import { prepareResumeBuild } from '../../../lib/resumeBuild'
import { createRenderScheduler } from '../../../lib/renderScheduler'

const initialFormValues: FormValues = {
  headings: {},
  sections: ['profile', 'education', 'work', 'skills', 'projects', 'awards'],
  selectedTemplate: 1
}

function hasContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  return (
    !!value &&
    typeof value === 'object' &&
    Object.values(value).some(hasContent)
  )
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

  const store = useStore()
  const [, setResume] = useAtom(resumeAtom)
  const [, setFormData] = useAtom(formDataAtom)
  const [, setResumeTags] = useAtom(resumeTagsAtom)
  const [isLoadingResume, setIsLoadingResume] = useAtom(isLoadingResumeAtom)
  const setFormSetValue = useSetAtom(formSetValueAtom)
  const markBuilt = useSetAtom(markBuiltAtom)
  const setResumeTitle = useSetAtom(resumeTitleAtom)
  const setLoadedResumeId = useSetAtom(loadedResumeIdAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const autoRender = useAtomValue(autoRenderAtom)
  const formContext = useForm<FormValues>({ defaultValues: initialFormValues })
  const [recovery, setRecovery] = useState<Recovery | null>(null)
  const scheduler = useMemo(() => createRenderScheduler({ compile: latex }), [])
  const owner = useMemo(
    () => ({ resumeId, active: true, ready: !resumeId, renders: 0 }),
    [resumeId]
  )

  useEffect(() => {
    owner.active = true
    return () => {
      owner.active = false
      scheduler.invalidate()
      setResume((current) => ({ ...current, isLoading: false }))
    }
  }, [owner, scheduler, setResume])

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const task = window.requestIdleCallback(() => void prewarm())
      return () => window.cancelIdleCallback(task)
    }
    const task = setTimeout(() => void prewarm(), 0)
    return () => clearTimeout(task)
  }, [])

  const generateAndSetResume = useCallback(
    async (
      formValues: FormValues,
      shouldCommit: () => boolean = () => true,
      force = false
    ) => {
      const buildPayload = prepareResumeBuild(formValues)
      owner.renders++
      setResume((current) => ({ ...current, isError: false, isLoading: true }))
      try {
        const result = await scheduler.request(
          { ...getTemplateData(buildPayload), owner },
          { force }
        )
        if (result.status === 'skipped') {
          if (result.built && owner.active && shouldCommit())
            markBuilt(buildPayload)
          return
        }
        if (result.status !== 'done') return
        if (!owner.active || !shouldCommit()) {
          URL.revokeObjectURL(result.url)
          return
        }
        markBuilt(buildPayload)
        setResume({ url: result.url, isError: false, isLoading: false })
      } catch (error) {
        if (!owner.active || !shouldCommit()) return
        console.error(error)
        setResume((current) => ({
          ...current,
          isError: true,
          isLoading: false
        }))
      } finally {
        owner.renders--
        if (owner.active)
          setResume((current) => ({
            ...current,
            isLoading: owner.renders > 0
          }))
      }
    },
    [setResume, markBuilt, scheduler, owner]
  )

  useEffect(() => {
    let cancelled = false
    let loaded: FormValues | undefined
    const renderLoaded = () => {
      if (cancelled || document.hidden || !loaded) return
      void generateAndSetResume(loaded, () => !cancelled)
      loaded = undefined
    }
    document.addEventListener('visibilitychange', renderLoaded)

    async function loadData() {
      setRecovery(null)
      if (resumeId) {
        setIsLoadingResume(true)
        try {
          const res = await fetch(`/api/resumes/${resumeId}`)
          if (!res.ok) return
          const data = await res.json()
          if (cancelled) return
          const content = data.content as FormValues
          // Offer back edits the server never confirmed, else drop the backup.
          const found = findRecovery(
            readDraft(browserStorage, resumeId),
            content,
            data.updatedAt
          )
          if (found) setRecovery(found)
          else clearDraft(browserStorage, resumeId)
          formContext.reset(content)
          setFormData(content)
          setLoadedResumeId(resumeId)
          setResumeTags(data.tags ?? [])
          setResumeTitle(data.title ?? '')
          owner.ready = true
          loaded = content
          renderLoaded()
        } finally {
          if (!cancelled) setIsLoadingResume(false)
        }
      } else {
        setIsLoadingResume(false)
        const lastSession = localStorage.getItem('jsonResume')
        if (lastSession) {
          const jsonResume = JSON.parse(lastSession) as FormValues
          formContext.reset(jsonResume)
          setFormData(jsonResume)
        } else {
          formContext.reset(initialFormValues)
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
      setLoadedResumeId(null)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', renderLoaded)
    }
  }, [
    resumeId,
    formContext,
    setFormData,
    setLoadedResumeId,
    setResumeTags,
    setResumeTitle,
    setIsLoadingResume,
    generateAndSetResume,
    owner
  ])

  useEffect(() => {
    let cancelled = false
    let revision = 0
    let timer: ReturnType<typeof setTimeout>
    const enabled = () =>
      !cancelled &&
      owner.ready &&
      !document.hidden &&
      !isLoadingResume &&
      autoRender
    const changed = () => {
      const version = ++revision
      clearTimeout(timer)
      if (!enabled()) return
      timer = setTimeout(async () => {
        if (!enabled()) return
        const valid = await formContext.trigger()
        if (!valid || !enabled() || version !== revision) return
        const payload = prepareResumeBuild(
          formContext.getValues(),
          pendingEdits
        )
        if (
          !resumeId &&
          !store.get(resumeAtom).url &&
          ![
            payload.basics,
            payload.work,
            payload.education,
            payload.skills,
            payload.projects,
            payload.awards
          ].some(hasContent)
        )
          return
        await generateAndSetResume(payload)
      }, 700)
    }
    const subscription = formContext.watch(changed)
    document.addEventListener('visibilitychange', changed)
    changed()
    return () => {
      cancelled = true
      clearTimeout(timer)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', changed)
    }
  }, [
    formContext,
    pendingEdits,
    autoRender,
    isLoadingResume,
    generateAndSetResume,
    resumeId,
    owner,
    store
  ])

  // Register setValue so the agent edit system can apply / restore values from outside the form
  useEffect(() => {
    if (!controlsExternalUpdates) return
    setFormSetValue(() => formContext.setValue)
    return () => setFormSetValue(null)
  }, [controlsExternalUpdates, setFormSetValue, formContext.setValue])

  const handleFormSubmit = useCallback(async () => {
    if (!owner.ready) return
    onMake?.()

    const formValues = prepareResumeBuild(formContext.getValues(), pendingEdits)

    await generateAndSetResume(formValues, undefined, true)
  }, [formContext, generateAndSetResume, onMake, pendingEdits, owner])

  // Restoring changes the form, so autosave saves the restored content.
  function restoreDraft() {
    if (!recovery) return
    const content = JSON.parse(recovery.content) as FormValues
    formContext.reset(content)
    setFormData(content)
    setRecovery(null)
  }

  function discardDraft() {
    if (resumeId) clearDraft(browserStorage, resumeId)
    setRecovery(null)
  }

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
            {recovery && (
              <RecoveryBanner
                recovery={recovery}
                onRestore={restoreDraft}
                onDiscard={discardDraft}
              />
            )}
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
