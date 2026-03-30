import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { FormSection } from './FormSection'
import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { agentPendingEditsAtom, type NewEntryEdit } from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Award } from '../../../../types'

export function AwardSection() {
  const { fields, append, remove } = useFieldArray({ name: 'awards' })
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultAward: Award = {
      title: '',
      date: '',
      awarder: '',
      summary: ''
    }

    append(defaultAward)
  }

  return (
    <FormSection title="Honors & Awards">
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
          (e): e is NewEntryEdit => e.type === 'append' && e.arrayPath === 'awards' && e.entryIndex === index && e.status === 'pending'
        )
        return (
          <div key={field.id}>
            <div
              data-array-path="awards"
              data-array-index={index}
              className={entryEdit ? 'rounded-lg ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]' : undefined}
            >
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
              <RemoveButton
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                - Remove Award
              </RemoveButton>
            </div>
            {entryEdit && <AgentEntryEditControls edit={entryEdit} />}
            <Divider />
          </div>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Award
      </AddButton>
    </FormSection>
  )
}
