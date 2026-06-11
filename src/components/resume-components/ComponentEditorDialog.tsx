'use client'

import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ComponentItemFields } from './ComponentItemFields'
import {
  componentMeta,
  getEmptyComponentContent,
  getRequiredValue,
  type ResumeComponent,
  type ResumeComponentContent,
  type ResumeComponentType
} from '@/lib/resumeComponents'
import type { FormValues } from '@/types'

interface ComponentEditorDialogProps {
  component?: ResumeComponent | null
  open: boolean
  type: ResumeComponentType
  onOpenChange: (open: boolean) => void
  onSave: (content: ResumeComponentContent) => Promise<void>
}

export function ComponentEditorDialog({
  component,
  open,
  type,
  onOpenChange,
  onSave
}: ComponentEditorDialogProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const defaultValues = useMemo(
    () => createFormValues(type, component),
    [component, type]
  )
  const form = useForm<FormValues>({ defaultValues })
  const isEditing = !!component

  useEffect(() => {
    if (open) {
      form.reset(createFormValues(type, component))
      setError(null)
    }
  }, [component, form, open, type])

  async function handleSubmit(values: FormValues) {
    const content = (values[type]?.[0] ??
      getEmptyComponentContent(type)) as ResumeComponentContent
    if (!getRequiredValue(type, content as Record<string, unknown>)) {
      setError(
        `${componentMeta[type].label} requires ${componentMeta[type].requiredField}`
      )
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave(content)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save component')
    } finally {
      setSaving(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && form.formState.isDirty) {
      const shouldClose = window.confirm('Discard unsaved changes?')
      if (!shouldClose) return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-h-[88vh] overflow-y-auto border border-app-border bg-app-surface text-slate-100"
      >
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing
              ? `Edit ${componentMeta[type].label}`
              : componentMeta[type].newLabel}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Saved components are copied into resumes when you add them.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            id="component-editor-form"
            className="space-y-0"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <ComponentItemFields type={type} index={0} />
            {error && (
              <p className="rounded-app-card border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
          </form>
        </FormProvider>

        <DialogFooter className="gap-2 sm:space-x-0">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleOpenChange(false)}
            className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm font-medium text-white transition hover:bg-app-controlHover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="component-editor-form"
            disabled={saving}
            className="rounded-app-button border border-white bg-white px-4 py-2 text-sm font-medium text-app-background transition hover:bg-app-primaryHover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function createFormValues(
  type: ResumeComponentType,
  component?: ResumeComponent | null
): FormValues {
  return {
    headings: {},
    sections: ['profile', 'education', 'work', 'skills', 'projects', 'awards'],
    selectedTemplate: 1,
    [type]: [component?.content ?? getEmptyComponentContent(type)]
  } as FormValues
}
