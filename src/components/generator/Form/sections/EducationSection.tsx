import { Fragment } from 'react'
import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { FormSection } from './FormSection'
import { CollapsibleFormItem } from './CollapsibleFormItem'
import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'

import { Education } from '../../../../types'

export function EducationSection() {
  const { fields, append, remove } = useFieldArray({ name: 'education' })
  const education = useWatch({ name: 'education' }) as Education[] | undefined
  const [expandedIndex, setExpandedIndex] = useState(0)

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
    setExpandedIndex(fields.length)
  }

  const handleRemove = (index: number) => {
    remove(index)
    setExpandedIndex((current) => {
      if (current === index) return Math.max(0, index - 1)
      if (current > index) return current - 1
      return current
    })
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
        const item = education?.[index]
        const summaryDetail = [item?.studyType, item?.area]
          .filter(Boolean)
          .join(' - ')

        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onExpand={() => setExpandedIndex(index)}
            summaryTitle={item?.institution || `School ${index + 1}`}
            summaryDetail={summaryDetail}
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
              onClick={() => handleRemove(index)}
            >
              - Remove School
            </RemoveButton>
            <Divider />
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add School
      </AddButton>
    </FormSection>
  )
}
