import { Fragment } from 'react'
import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import { CollapsibleFormItem } from './CollapsibleFormItem'
import Keywords from './Keywords'

import { Skill } from '../../../../types'

export function SkillsSection() {
  const { fields, append, remove } = useFieldArray({ name: 'skills' })
  const skills = useWatch({ name: 'skills' }) as Skill[] | undefined
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const handleAdd = () => {
    const defaultSkill: Skill = {
      name: '',
      keywords: []
    }

    append(defaultSkill)
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
        const item = skills?.[index]
        const summaryDetail = item?.keywords?.filter(Boolean).join(', ')

        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onToggle={() =>
              setExpandedIndex((current) => (current === index ? null : index))
            }
            onRemove={() => handleRemove(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove skill"
            summaryTitle={item?.name || `Skill ${index + 1}`}
            summaryDetail={summaryDetail}
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
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Skill
      </AddButton>
    </FormSection>
  )
}
