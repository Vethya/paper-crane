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

import { Work } from '../../../../types'
import { componentInsertFocusAtom } from '@/atoms/resumeComponents'

export function WorkSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    insertAndExpand,
    moveAndPreserveExpanded,
    removeAndAdjustExpanded,
    setExpandedIndex,
    toggleExpanded
  } = useCollapsibleFieldArray('work')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const focusRequest = useAtomValue(componentInsertFocusAtom)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const items = useWatch({ name: 'work' }) as Work[] | undefined

  useEffect(() => {
    if (focusRequest?.type === 'work') {
      setExpandedIndex(focusRequest.index)
    }
  }, [focusRequest, setExpandedIndex])

  const handleAdd = () => {
    const defaultWork: Work = {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      highlights: []
    }

    appendAndExpand(defaultWork)
  }

  return (
    <FormSection title="Your Work Experience">
      {fields.length === 0 && (
        <Fragment>
          <p className="text-gray-400">No work experience added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add Work Experience
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.work"
          label="Section Heading"
          placeholder="Work"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'work' &&
            e.entryIndex === index &&
            e.status === 'pending'
        )

        return (
          <Fragment key={field.id}>
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
            <CollapsibleFormItem
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
                    type: 'work',
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
              removeLabel="Remove work experience"
              summary={<WorkSummary index={index} />}
            >
              <div data-array-path="work" data-array-index={index}>
                <ComponentItemFields type="work" index={index} />
              </div>
            </CollapsibleFormItem>
          </Fragment>
        )
      })}
      {fields.length > 0 && (
        <DropZone
          active={dropIndex === fields.length}
          onDrop={(event) => {
            handleDrop(event, fields.length)
            setDropIndex(null)
          }}
          onDragLeave={() => setDropIndex(null)}
          onDragOver={(event) => {
            if (acceptsDrop(event)) {
              event.preventDefault()
              setDropIndex(fields.length)
            }
          }}
        />
      )}
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
        + Add Work Experience
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
      if (data.type === 'work') insertAndExpand(targetIndex, data.content)
      return
    }

    const formItem = event.dataTransfer.getData(
      'application/x-resume-form-item'
    )
    if (!formItem) return
    const data = JSON.parse(formItem)
    if (data.type !== 'work' || data.index === targetIndex) return
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
      className={`my-1 h-4 rounded-full transition ${
        active ? 'bg-emerald-400/80' : 'bg-transparent'
      }`}
    />
  )
}

function WorkSummary({ index }: { index: number }) {
  const item = useWatch({ name: `work.${index}` }) as Work | undefined
  const summaryDetail = [item?.position, item?.location]
    .filter(Boolean)
    .join(' - ')

  return (
    <CollapsibleFormItemSummary
      title={item?.company || `Work Experience ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
