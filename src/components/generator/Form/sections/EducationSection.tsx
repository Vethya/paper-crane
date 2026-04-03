import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { FormSection } from './FormSection'
import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { agentPendingEditsAtom, type NewEntryEdit, type RemoveEntryEdit } from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Education } from '../../../../types'

export function EducationSection() {
  const { fields, append, remove } = useFieldArray({ name: 'education' })
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultEducation: Education = {
      institution: '',
      location: '',
      studyType: '',
      area: '',
      score: '',
      startDate: '',
      endDate: ''
    }

    append(defaultEducation)
  }

  return (
    <FormSection title="Your Educational Background">
      {fields.length > 0 && (
        <Fragment>
          <LabeledInput
            name="headings.education"
            label="Section Heading"
            placeholder="Education"
          />
          <Divider />
        </Fragment>
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') && e.arrayPath === 'education' && e.entryIndex === index && e.status === 'pending'
        )
        return (
          <div key={field.id}>
            <div
              data-array-path="education"
              data-array-index={index}
              className={entryEdit
                ? entryEdit.type === 'remove'
                  ? 'rounded-lg ring-2 ring-rose-400/70 shadow-[0_0_0_3px_rgba(251,113,133,0.12)]'
                  : 'rounded-lg ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                : undefined}
            >
              <LabeledInput
                name={`education.${index}.institution`}
                label="School name"
                placeholder="Rutgers University"
              />
              <LabeledInput
                name={`education.${index}.location`}
                label="School Location"
                placeholder="New Brunswick, NJ"
              />
              <LabeledInput
                name={`education.${index}.studyType`}
                label="Degree"
                placeholder="Bachelor's"
              />
              <LabeledInput
                name={`education.${index}.area`}
                label="Major"
                placeholder="Computer Science"
              />
              <LabeledInput
                name={`education.${index}.score`}
                label="GPA"
                placeholder="3.8"
              />
              <LabeledInput
                name={`education.${index}.startDate`}
                label="Start Date"
                placeholder="Sep 2015"
              />
              <LabeledInput
                name={`education.${index}.endDate`}
                label="End Date"
                placeholder="Jun 2019"
              />
              <RemoveButton
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                - Remove School
              </RemoveButton>
            </div>
            {entryEdit && <AgentEntryEditControls edit={entryEdit} />}
            <Divider />
          </div>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add School
      </AddButton>
    </FormSection>
  )
}
