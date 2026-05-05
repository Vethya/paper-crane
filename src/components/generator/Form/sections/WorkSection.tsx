import { Fragment } from 'react'
import { useWatch } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton } from '../../../core/Button'
import { FormSection } from './FormSection'
import {
  CollapsibleFormItem,
  CollapsibleFormItemSummary
} from './CollapsibleFormItem'
import { useCollapsibleFieldArray } from './useCollapsibleFieldArray'
import Highlights from './Highlights'
import {
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Work } from '../../../../types'

export function WorkSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('work')
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultWork: Work = {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      highlights: []
    }

    appendAndExpand(defaultWork)
  }

  return (
    <FormSection title="Your Work Experience">
      {fields.length === 0 && (
        <Fragment>
          <p className="text-gray-400">No work experience added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add Work Experience
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.work"
          label="Section Heading"
          placeholder="Work"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'work' &&
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
            removeLabel="Remove work experience"
            summary={<WorkSummary index={index} />}
          >
            <div data-array-path="work" data-array-index={index}>
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
            </div>
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
