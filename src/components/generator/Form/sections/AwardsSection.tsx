import { Fragment } from 'react'
import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { FormSection } from './FormSection'
import { CollapsibleFormItem } from './CollapsibleFormItem'
import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'

import { Award } from '../../../../types'

export function AwardSection() {
  const { fields, append, remove } = useFieldArray({ name: 'awards' })
  const awards = useWatch({ name: 'awards' }) as Award[] | undefined
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const handleAdd = () => {
    const defaultAward: Award = {
      title: '',
      date: '',
      awarder: '',
      summary: ''
    }

    append(defaultAward)
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
        const item = awards?.[index]
        const summaryDetail = [item?.awarder, item?.date]
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
            removeLabel="Remove award"
            summaryTitle={item?.title || `Award ${index + 1}`}
            summaryDetail={summaryDetail}
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
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Award
      </AddButton>
    </FormSection>
  )
}
