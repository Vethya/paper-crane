import { Fragment } from 'react'
import { useWatch } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { FormSection } from './FormSection'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import Keywords from './Keywords'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Skill } from '../../../../types'

export function SkillsSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('skills')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultSkill: Skill = {
      name: '',
      keywords: []
    }

    appendAndExpand(defaultSkill)
  }

  return (
    <FormSection title="Your Skills">
      {fields.length === 0 && (
        <Fragment>
          <p className="text-gray-400">No skills added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add Skill
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.skills"
          label="Section Heading"
          placeholder="Skills"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'skills' &&
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
            onRemove={() => removeAndAdjustExpanded(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove skill"
            summary={<SkillSummary index={index} />}
          >
            <div data-array-path="skills" data-array-index={index}>
              <LabeledInput
                name={`skills.${index}.name`}
                label="Skill name"
                placeholder="Programming Languages"
              />
              <Keywords
                label="Skill Details"
                placeholder="TypeScript"
                name={`skills.${index}.keywords`}
              />
            </div>
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Skill
      </AddButton>
    </FormSection>
  )
}

function SkillSummary({ index }: { index: number }) {
  const item = useWatch({ name: `skills.${index}` }) as Skill | undefined
  const summaryDetail = item?.keywords?.filter(Boolean).join(', ')

  return (
    <CollapsibleFormItemSummary
      title={item?.name || `Skill ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
