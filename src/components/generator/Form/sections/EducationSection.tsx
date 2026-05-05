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
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Education } from '../../../../types'

export function EducationSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('education')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

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
          <p className="text-gray-400">No education added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add School
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
            removeLabel="Remove school"
            summary={<EducationSummary index={index} />}
          >
            <div data-array-path="education" data-array-index={index}>
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
            </div>
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add School
      </AddButton>
    </FormSection>
  )
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
