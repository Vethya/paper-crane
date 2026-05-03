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

import { Project } from '../../../../types'

export function ProjectsSection() {
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray('projects')

  const handleAdd = () => {
    const defaultProject: Project = {
      name: '',
      description: '',
      keywords: [],
      url: ''
    }

    appendAndExpand(defaultProject)
  }

  return (
    <FormSection title="Your Projects">
      {fields.length > 0 && (
        <Fragment>
          <LabeledInput
            name="headings.projects"
            label="Section Heading"
            placeholder="Projects"
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
            removeLabel="Remove project"
            summary={<ProjectSummary index={index} />}
          >
            <LabeledInput
              name={`projects.${index}.name`}
              label="Project Name"
              placeholder="Piper Chat"
            />
            <LabeledInput
              name={`projects.${index}.description`}
              label="Project Description"
              placeholder="A video chat app with great picture quality."
            />
            <LabeledInput
              name={`projects.${index}.url`}
              label="Link to Project"
              placeholder="http://piperchat.com"
            />
            <Keywords
              label="Tools Used"
              placeholder="TypeScript"
              name={`projects.${index}.keywords`}
            />
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Project
      </AddButton>
    </FormSection>
  )
}

function ProjectSummary({ index }: { index: number }) {
  const item = useWatch({ name: `projects.${index}` }) as Project | undefined
  const summaryDetail =
    item?.description || item?.keywords?.filter(Boolean).join(', ')

  return (
    <CollapsibleFormItemSummary
      title={item?.name || `Project ${index + 1}`}
      detail={summaryDetail}
    />
  )
}
