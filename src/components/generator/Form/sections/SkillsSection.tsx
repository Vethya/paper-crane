import { Fragment } from 'react'
import { useWatch } from 'react-hook-form'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import Keywords from './Keywords'

import { Skill } from '../../../../types'

export function SkillsSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('skills')

  const handleAdd = () => {
    const defaultSkill: Skill = {
      name: '',
      keywords: []
    }

    appendAndExpand(defaultSkill)
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
        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            onRemove={() => removeAndAdjustExpanded(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove skill"
            summary={<SkillSummary index={index} />}
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

function SkillSummary({ index }: { index: number }) {
  const item = useWatch({ name: `skills.${index}` }) as Skill | undefined
  const summaryDetail = item?.keywords?.filter(Boolean).join(', ')

  return (
    <CollapsibleFormItemSummary
      title={item?.name || `Skill ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
