import { DragEvent, Fragment, HTMLAttributes, useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { ComponentItemFields } from '@/components/resume-components/ComponentItemFields'
import { AddButton } from '../../../core/Button'
import { LabeledInput } from '../../../core/LabeledInput'
import { FormSection } from './FormSection'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Project } from '../../../../types'
import { componentInsertFocusAtom } from '@/atoms/resumeComponents'

export function ProjectsSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    insertAndExpand,
    moveAndPreserveExpanded,
    removeAndAdjustExpanded,
    setExpandedIndex,
    toggleExpanded
  } = useCollapsibleFieldArray('projects')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const focusRequest = useAtomValue(componentInsertFocusAtom)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const items = useWatch({ name: 'projects' }) as Project[] | undefined

  useEffect(() => {
    if (focusRequest?.type === 'projects') {
      setExpandedIndex(focusRequest.index)
    }
  }, [focusRequest, setExpandedIndex])

  const handleAdd = () => {
    const defaultProject: Project = {
      name: '',
      description: '',
      keywords: [],
      url: ''
    }

    appendAndExpand(defaultProject)
  }

  return (
    <FormSection title="Your Projects">
      {fields.length === 0 && (
        <Fragment>
          <p className="text-gray-400">No projects added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add Project
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.projects"
          label="Section Heading"
          placeholder="Projects"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'projects' &&
            e.entryIndex === index &&
            e.status === 'pending'
        )

        return (
          <CollapsibleFormItem
            key={field.id}
            className={
              entryEdit
                ? entryEdit.type === 'remove'
                  ? 'ring-2 ring-rose-400/70 shadow-[0_0_0_3px_rgba(251,113,133,0.12)]'
                  : 'review-field-highlight'
                : undefined
            }
            footer={
              entryEdit ? (
                <AgentEntryEditControls edit={entryEdit} />
              ) : undefined
            }
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'copyMove'
              event.dataTransfer.setData(
                'application/x-resume-form-item',
                JSON.stringify({
                  source: 'resume-form',
                  type: 'projects',
                  index,
                  content: items?.[index]
                })
              )
            }}
            onMoveUp={
              index > 0
                ? () => moveAndPreserveExpanded(index, index - 1)
                : undefined
            }
            onMoveDown={
              index < fields.length - 1
                ? () => moveAndPreserveExpanded(index, index + 1)
                : undefined
            }
            onRemove={() => removeAndAdjustExpanded(index)}
            removeLabel="Remove project"
            summary={<ProjectSummary index={index} />}
          >
            <DropZone
              active={dropIndex === index}
              onDrop={(event) => {
                handleDrop(event, index)
                setDropIndex(null)
              }}
              onDragLeave={() => setDropIndex(null)}
              onDragOver={(event) => {
                if (acceptsDrop(event)) {
                  event.preventDefault()
                  setDropIndex(index)
                }
              }}
            />
            <div data-array-path="projects" data-array-index={index}>
              <ComponentItemFields type="projects" index={index} />
            </div>
            <DropZone
              active={dropIndex === index + 1}
              onDrop={(event) => {
                handleDrop(event, index + 1)
                setDropIndex(null)
              }}
              onDragLeave={() => setDropIndex(null)}
              onDragOver={(event) => {
                if (acceptsDrop(event)) {
                  event.preventDefault()
                  setDropIndex(index + 1)
                }
              }}
            />
          </CollapsibleFormItem>
        )
      })}
      {fields.length === 0 && (
        <DropZone
          active={dropIndex === 0}
          onDrop={(event) => {
            handleDrop(event, 0)
            setDropIndex(null)
          }}
          onDragLeave={() => setDropIndex(null)}
          onDragOver={(event) => {
            if (acceptsDrop(event)) {
              event.preventDefault()
              setDropIndex(0)
            }
          }}
        />
      )}
      <AddButton type="button" onClick={handleAdd}>
        + Add Project
      </AddButton>
    </FormSection>
  )

  function acceptsDrop(event: DragEvent<HTMLElement>) {
    return (
      event.dataTransfer.types.includes('application/x-resume-component') ||
      event.dataTransfer.types.includes('application/x-resume-form-item')
    )
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault()
    const component = event.dataTransfer.getData(
      'application/x-resume-component'
    )
    if (component) {
      const data = JSON.parse(component)
      if (data.type === 'projects') insertAndExpand(targetIndex, data.content)
      return
    }

    const formItem = event.dataTransfer.getData(
      'application/x-resume-form-item'
    )
    if (!formItem) return
    const data = JSON.parse(formItem)
    if (data.type !== 'projects' || data.index === targetIndex) return
    moveAndPreserveExpanded(
      data.index,
      data.index < targetIndex ? targetIndex - 1 : targetIndex
    )
  }
}

function DropZone({
  active,
  ...props
}: {
  active: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`my-2 h-2 rounded-full transition ${
        active ? 'bg-emerald-400/80' : 'bg-transparent'
      }`}
    />
  )
}

function ProjectSummary({ index }: { index: number }) {
  const item = useWatch({ name: `projects.${index}` }) as Project | undefined
  const summaryDetail =
    item?.description || item?.keywords?.filter(Boolean).join(', ')

  return (
    <CollapsibleFormItemSummary
      title={item?.name || `Project ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
