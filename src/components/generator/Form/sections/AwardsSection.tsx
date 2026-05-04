import { Fragment } from 'react'
import { useWatch } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { FormSection } from './FormSection'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Award } from '../../../../types'

export function AwardSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('awards')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

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
        <Fragment>
          <LabeledInput
            name="headings.awards"
            label="Section Heading"
            placeholder="Awards"
          />
          <Divider />
        </Fragment>
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
          <CollapsibleFormItem
            key={field.id}
            className={
              entryEdit
                ? entryEdit.type === 'remove'
                  ? 'ring-2 ring-rose-400/70 shadow-[0_0_0_3px_rgba(251,113,133,0.12)]'
                  : 'ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                : undefined
            }
            footer={
              entryEdit ? (
                <AgentEntryEditControls edit={entryEdit} />
              ) : undefined
            }
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            onRemove={() => removeAndAdjustExpanded(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove award"
            summary={<AwardSummary index={index} />}
          >
            <div data-array-path="awards" data-array-index={index}>
              <LabeledInput
                name={`awards.${index}.title`}
                label="Award Name"
                placeholder="Supreme hacker"
              />
              <LabeledInput
                name={`awards.${index}.date`}
                label="Award Date"
                placeholder="May 2015"
              />
              <LabeledInput
                name={`awards.${index}.awarder`}
                label="Awarder"
                placeholder="HackNY"
              />
              <LabeledInput
                name={`awards.${index}.summary`}
                label="Summary"
                placeholder="Recognized for creating the most awesome project at a hackathon."
              />
            </div>
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Award
      </AddButton>
    </FormSection>
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
