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

import { Award } from '../../../../types'

export function AwardSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('awards')

  const handleAdd = () => {
    const defaultAward: Award = {
      title: '',
      date: '',
      awarder: '',
      summary: ''
    }

    appendAndExpand(defaultAward)
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
        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            onRemove={() => removeAndAdjustExpanded(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove award"
            summary={<AwardSummary index={index} />}
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

function AwardSummary({ index }: { index: number }) {
  const item = useWatch({ name: `awards.${index}` }) as Award | undefined
  const summaryDetail = [item?.awarder, item?.date].filter(Boolean).join(' - ')

  return (
    <CollapsibleFormItemSummary
      title={item?.title || `Award ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
