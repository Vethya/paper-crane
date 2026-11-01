import { DragEvent, Fragment, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useWatch } from 'react-hook-form'
import { useAtomValue, useSetAtom } from 'jotai'

import { ComponentItemFields } from '@/components/resume-components/ComponentItemFields'
import { FormSection } from './FormSection'
import { LabeledInput } from '../../../core/LabeledInput'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { FormItemDropZone } from './FormItemDropZone'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import { AddButton } from '../../../core/Button'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Education } from '../../../../types'
import { componentInsertFocusAtom } from '@/atoms/resumeComponents'

export function EducationSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    insertAndExpand,
    moveAndPreserveExpanded,
    removeAndAdjustExpanded,
    setExpandedIndex,
    toggleExpanded
  } = useCollapsibleFieldArray('education')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const focusRequest = useAtomValue(componentInsertFocusAtom)
  const setFocusRequest = useSetAtom(componentInsertFocusAtom)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const items = useWatch({ name: 'education' }) as Education[] | undefined

  useEffect(() => {
    if (focusRequest?.type === 'education') {
      setExpandedIndex(focusRequest.index)
      setFocusRequest(null)
    }
  }, [focusRequest, setExpandedIndex, setFocusRequest])

  const handleAdd = () => {
    const defaultEducation: Education = {
      institution: '',
      location: '',
      area: '',
      studyType: '',
      score: '',
      startDate: '',
      endDate: ''
    }

    appendAndExpand(defaultEducation)
  }

  return (
    <FormSection title="Your Educational Background">
      {fields.length === 0 && (
        <Fragment>
          <p className="mb-2 text-sm text-slate-400">No education added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add School
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.education"
          label="Section Heading"
          placeholder="Education"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'education' &&
            e.entryIndex === index &&
            e.status === 'pending'
        )

        return (
          <Fragment key={field.id}>
            <FormItemDropZone
              active={dropIndex === index}
              size={fields.length === 1 ? 'spacious' : 'normal'}
              onDrop={(event) => {
                handleDrop(event, index)
                setDropIndex(null)
              }}
              onDragLeave={() => setDropIndex(null)}
              onDragOver={(event) => {
                if (acceptsDrop(event)) {
                  event.preventDefault()
                  setDropIndex((current) =>
                    current === index ? current : index
                  )
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
                    type: 'education',
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
              removeLabel="Remove school"
              summary={<EducationSummary index={index} />}
            >
              <div data-array-path="education" data-array-index={index}>
                <ComponentItemFields type="education" index={index} />
              </div>
            </CollapsibleFormItem>
          </Fragment>
        )
      })}
      {fields.length > 0 && (
        <FormItemDropZone
          active={dropIndex === fields.length}
          size={fields.length === 1 ? 'spacious' : 'normal'}
          onDrop={(event) => {
            handleDrop(event, fields.length)
            setDropIndex(null)
          }}
          onDragLeave={() => setDropIndex(null)}
          onDragOver={(event) => {
            if (acceptsDrop(event)) {
              event.preventDefault()
              setDropIndex((current) =>
                current === fields.length ? current : fields.length
              )
            }
          }}
        />
      )}
      {fields.length === 0 && (
        <FormItemDropZone
          active={dropIndex === 0}
          size="empty"
          onDrop={(event) => {
            handleDrop(event, 0)
            setDropIndex(null)
          }}
          onDragLeave={() => setDropIndex(null)}
          onDragOver={(event) => {
            if (acceptsDrop(event)) {
              event.preventDefault()
              setDropIndex((current) => (current === 0 ? current : 0))
            }
          }}
        />
      )}
      <AddButton type="button" onClick={handleAdd}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add School
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
      let data: { type?: unknown; content?: unknown }
      try {
        data = JSON.parse(component)
      } catch {
        return
      }
      if (data.type === 'education') {
        insertAndExpand(targetIndex, data.content as Education)
      }
      return
    }

    const formItem = event.dataTransfer.getData(
      'application/x-resume-form-item'
    )
    if (!formItem) return
    let data: { type?: unknown; index?: unknown }
    try {
      data = JSON.parse(formItem)
    } catch {
      return
    }
    if (
      data.type !== 'education' ||
      typeof data.index !== 'number' ||
      data.index === targetIndex
    ) {
      return
    }
    moveAndPreserveExpanded(
      data.index,
      data.index < targetIndex ? targetIndex - 1 : targetIndex
    )
  }
}

function EducationSummary({ index }: { index: number }) {
  const item = useWatch({ name: `education.${index}` }) as Education | undefined
  const summaryDetail = [item?.studyType, item?.area]
    .filter(Boolean)
    .join(' - ')

  return (
    <CollapsibleFormItemSummary
      title={item?.institution || `School ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
