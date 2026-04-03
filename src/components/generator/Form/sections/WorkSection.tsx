import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import Highlights from './Highlights'
import { agentPendingEditsAtom, type NewEntryEdit, type RemoveEntryEdit } from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Work } from '../../../../types'

export function WorkSection() {
  const { fields, append, remove } = useFieldArray({ name: 'work' })
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultWork: Work = {
      company: '',
      location: '',
      position: '',
      startDate: '',
      endDate: '',
      highlights: []
    }

    append(defaultWork)
  }

  return (
    <FormSection title="Your Work Experience">
      {fields.length > 0 && (
        <Fragment>
          <LabeledInput
            name="headings.work"
            label="Section Heading"
            placeholder="Work"
          />
          <Divider />
        </Fragment>
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') && e.arrayPath === 'work' && e.entryIndex === index && e.status === 'pending'
        )
        return (
          <div key={field.id}>
            <div
              data-array-path="work"
              data-array-index={index}
              className={entryEdit
                ? entryEdit.type === 'remove'
                  ? 'rounded-lg ring-2 ring-rose-400/70 shadow-[0_0_0_3px_rgba(251,113,133,0.12)]'
                  : 'rounded-lg ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                : undefined}
            >
              <LabeledInput
                name={`work.${index}.company`}
                label="Company name"
                placeholder="Netflix"
              />
              <LabeledInput
                name={`work.${index}.location`}
                label="Location"
                placeholder="Los Gatos, CA"
              />
              <LabeledInput
                name={`work.${index}.position`}
                label="Position"
                placeholder="Software Engineer"
              />
              <LabeledInput
                name={`work.${index}.startDate`}
                label="Start Date"
                placeholder="Sep 2015"
              />
              <LabeledInput
                name={`work.${index}.endDate`}
                label="End Date"
                placeholder="Jun 2019"
              />
              <Highlights
                label="Job Responsibilities"
                placeholder="Did cool stuff at company"
                name={`work.${index}.highlights`}
              />
              <RemoveButton
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                - Remove Work Experience
              </RemoveButton>
            </div>
            {entryEdit && <AgentEntryEditControls edit={entryEdit} />}
            <Divider />
          </div>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Work Experience
      </AddButton>
    </FormSection>
  )
}
