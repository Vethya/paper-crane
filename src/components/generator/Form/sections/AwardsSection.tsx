import { DragEvent, Fragment, HTMLAttributes, useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { ComponentItemFields } from '@/components/resume-components/ComponentItemFields'
import { FormSection } from './FormSection'
import { LabeledInput } from '../../../core/LabeledInput'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import { AddButton } from '../../../core/Button'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Award } from '../../../../types'
import { componentInsertFocusAtom } from '@/atoms/resumeComponents'

export function AwardSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    insertAndExpand,
    moveAndPreserveExpanded,
    removeAndAdjustExpanded,
    setExpandedIndex,
    toggleExpanded
  } = useCollapsibleFieldArray('awards')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const focusRequest = useAtomValue(componentInsertFocusAtom)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const items = useWatch({ name: 'awards' }) as Award[] | undefined

  useEffect(() => {
    if (focusRequest?.type === 'awards') {
      setExpandedIndex(focusRequest.index)
    }
  }, [focusRequest, setExpandedIndex])

  const handleAdd = () => {
    const defaultAward: Award = {
      title: '',
      date: '',
      awarder: '',
      summary: ''
    }

    appendAndExpand(defaultAward)
  }

  return (
    <FormSection title="Honors & Awards">
      {fields.length === 0 && (
        <Fragment>
          <p className="text-gray-400">No awards added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add Award
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.awards"
          label="Section Heading"
          placeholder="Awards"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'awards' &&
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
                    type: 'awards',
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
              removeLabel="Remove award"
              summary={<AwardSummary index={index} />}
            >
              <div data-array-path="awards" data-array-index={index}>
                <ComponentItemFields type="awards" index={index} />
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
        + Add Award
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
      if (data.type === 'awards') insertAndExpand(targetIndex, data.content)
      return
    }

    const formItem = event.dataTransfer.getData(
      'application/x-resume-form-item'
    )
    if (!formItem) return
    const data = JSON.parse(formItem)
    if (data.type !== 'awards' || data.index === targetIndex) return
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

function AwardSummary({ index }: { index: number }) {
  const item = useWatch({ name: `awards.${index}` }) as Award | undefined
  const summaryDetail = [item?.awarder, item?.date].filter(Boolean).join(' - ')

  return (
    <CollapsibleFormItemSummary
      title={item?.title || `Award ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
