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
import Highlights from './Highlights'

import { Work } from '../../../../types'

export function WorkSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('work')

  const handleAdd = () => {
    const defaultWork: Work = {
      company: '',
      location: '',
      position: '',
      startDate: '',
      endDate: '',
      highlights: []
    }

    appendAndExpand(defaultWork)
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
        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            onRemove={() => removeAndAdjustExpanded(index)}
            removeDisabled={fields.length === 1}
            removeLabel="Remove work experience"
            summary={<WorkSummary index={index} />}
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

function WorkSummary({ index }: { index: number }) {
  const item = useWatch({ name: `work.${index}` }) as Work | undefined
  const summaryDetail = [item?.position, item?.location]
    .filter(Boolean)
    .join(' - ')

  return (
    <CollapsibleFormItemSummary
      title={item?.company || `Work Experience ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
