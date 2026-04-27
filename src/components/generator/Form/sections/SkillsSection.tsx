import { Fragment } from 'react'
import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import { CollapsibleFormItem } from './CollapsibleFormItem'
import Keywords from './Keywords'

import { Skill } from '../../../../types'

export function SkillsSection() {
  const { fields, append, remove } = useFieldArray({ name: 'skills' })
  const skills = useWatch({ name: 'skills' }) as Skill[] | undefined
  const [expandedIndex, setExpandedIndex] = useState(0)

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
            onExpand={() => setExpandedIndex(index)}
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
            <RemoveButton
              type="button"
              disabled={fields.length === 1}
              onClick={() => handleRemove(index)}
            >
              - Remove Skill
            </RemoveButton>
            <Divider />
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Skill
      </AddButton>
    </FormSection>
  )
}
