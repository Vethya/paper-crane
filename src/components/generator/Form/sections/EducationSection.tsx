import { Fragment } from 'react'
import { useWatch } from 'react-hook-form'

import { FormSection } from './FormSection'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'

import { Education } from '../../../../types'

export function EducationSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('education')

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

    appendAndExpand(defaultEducation)
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
        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            onRemove={() => removeAndAdjustExpanded(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove school"
            summary={<EducationSummary index={index} />}
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
