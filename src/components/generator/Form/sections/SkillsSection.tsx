import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import Keywords from './Keywords'
import { agentPendingEditsAtom, type NewEntryEdit } from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Skill } from '../../../../types'

export function SkillsSection() {
  const { fields, append, remove } = useFieldArray({ name: 'skills' })
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultSkill: Skill = {
      name: '',
      keywords: []
    }

    append(defaultSkill)
  }

  return (
    <FormSection title="Your Skills">
      {fields.length > 0 && (
        <Fragment>
          <LabeledInput
            name="headings.skills"
            label="Section Heading"
            placeholder="Skills"
          />
          <Divider />
        </Fragment>
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit => e.type === 'append' && e.arrayPath === 'skills' && e.entryIndex === index && e.status === 'pending'
        )
        return (
          <div key={field.id}>
            <div
              data-array-path="skills"
              data-array-index={index}
              className={entryEdit ? 'rounded-lg ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]' : undefined}
            >
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
              <RemoveButton
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                - Remove Skill
              </RemoveButton>
            </div>
            {entryEdit && <AgentEntryEditControls edit={entryEdit} />}
            <Divider />
          </div>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Skill
      </AddButton>
    </FormSection>
  )
}
