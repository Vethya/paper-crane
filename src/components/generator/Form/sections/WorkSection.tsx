import { Fragment } from 'react'
import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import { CollapsibleFormItem } from './CollapsibleFormItem'
import Highlights from './Highlights'

import { Work } from '../../../../types'

export function WorkSection() {
  const { fields, append, remove } = useFieldArray({ name: 'work' })
  const work = useWatch({ name: 'work' }) as Work[] | undefined
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

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
    setExpandedIndex(fields.length)
  }

  const handleRemove = (index: number) => {
    remove(index)
    setExpandedIndex((current) => {
      if (current === null) return null
      if (current === index) return Math.max(0, index - 1)
      if (current > index) return current - 1
      return current
    })
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
        const item = work?.[index]
        const summaryDetail = [item?.position, item?.location]
          .filter(Boolean)
          .join(' - ')

        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onToggle={() =>
              setExpandedIndex((current) => (current === index ? null : index))
            }
            onRemove={() => handleRemove(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove work experience"
            summaryTitle={item?.company || `Work Experience ${index + 1}`}
            summaryDetail={summaryDetail}
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
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Work Experience
      </AddButton>
    </FormSection>
  )
}
