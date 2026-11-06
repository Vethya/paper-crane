'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  componentMeta,
  getComponentPreview,
  getComponentTitle,
  type ResumeComponent,
  type ResumeComponentContent
} from '@/lib/resumeComponents'
import type { Award, Education, Project, Skill, Work } from '@/types'

interface ComponentDetailsDialogProps {
  component: ResumeComponent | null
  mode: 'library' | 'panel'
  onOpenChange: (open: boolean) => void
  onAdd?: (component: ResumeComponent) => void
  onDelete?: (component: ResumeComponent) => void
  onEdit?: (component: ResumeComponent) => void
}

export function ComponentDetailsDialog({
  component,
  mode,
  onOpenChange,
  onAdd,
  onDelete,
  onEdit
}: ComponentDetailsDialogProps) {
  if (!component) return null

  const title = getComponentTitle(component.type, component.content)
  const preview = getComponentPreview(component.type, component.content)

  return (
    <Dialog open={!!component} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border border-app-border bg-app-surface text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {componentMeta[component.type].label}
            {preview ? ` · ${preview}` : ''}
          </DialogDescription>
        </DialogHeader>

        <ComponentReadOnlyFields component={component} />

        <DialogFooter className="gap-2 sm:space-x-0">
          {mode === 'library' && (
            <>
              <button
                type="button"
                onClick={() => onDelete?.(component)}
                className="rounded-app-button border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(component)}
                className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm font-medium text-white transition hover:bg-app-controlHover"
              >
                Edit
              </button>
            </>
          )}
          {mode === 'panel' && (
            <button
              type="button"
              onClick={() => onAdd?.(component)}
              className="rounded-app-button border border-white bg-white px-4 py-2 text-sm font-medium text-app-background transition hover:bg-app-primaryHover"
            >
              Add
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ComponentReadOnlyFields({
  component
}: {
  component: ResumeComponent
}) {
  const rows = getRows(component.type, component.content)

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-app-button border border-app-controlBorder bg-app-control/45 px-4 py-3"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {row.label}
          </div>
          {Array.isArray(row.value) ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {row.value.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="rounded-app-button border border-app-controlBorder bg-app-surface px-2.5 py-1 text-xs text-slate-200"
                >
                  {value}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">
              {row.value}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function row(label: string, value?: string | string[]) {
  if (Array.isArray(value)) {
    const values = value.filter(Boolean)
    return values.length ? { label, value: values } : null
  }
  return value?.trim() ? { label, value } : null
}

function getRows(
  type: ResumeComponent['type'],
  content: ResumeComponentContent
) {
  if (type === 'education') {
    const item = content as Education
    return [
      row('Institution', item.institution),
      row('Degree', item.studyType),
      row('Major', item.area),
      row('Location', item.location),
      row('Dates', [item.startDate, item.endDate].filter(Boolean).join(' - ')),
      row('GPA', item.score)
    ].filter(Boolean) as { label: string; value: string | string[] }[]
  }
  if (type === 'work') {
    const item = content as Work
    return [
      row('Company', item.company),
      row('Position', item.position),
      row('Location', item.location),
      row('Dates', [item.startDate, item.endDate].filter(Boolean).join(' - ')),
      row('Responsibilities', item.highlights)
    ].filter(Boolean) as { label: string; value: string | string[] }[]
  }
  if (type === 'skills') {
    const item = content as Skill
    return [row('Skill', item.name), row('Keywords', item.keywords)].filter(
      Boolean
    ) as { label: string; value: string | string[] }[]
  }
  if (type === 'projects') {
    const item = content as Project
    return [
      row('Project', item.name),
      row('Description', item.description),
      row('Tools', item.keywords),
      row('URL', item.url)
    ].filter(Boolean) as { label: string; value: string | string[] }[]
  }
  const item = content as Award
  return [
    row('Award', item.title),
    row('Awarder', item.awarder),
    row('Date', item.date),
    row('Summary', item.summary)
  ].filter(Boolean) as { label: string; value: string | string[] }[]
}
