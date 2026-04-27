import { Fragment } from 'react'
import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import { CollapsibleFormItem } from './CollapsibleFormItem'
import Keywords from './Keywords'

import { Project } from '../../../../types'

export function ProjectsSection() {
  const { fields, append, remove } = useFieldArray({ name: 'projects' })
  const projects = useWatch({ name: 'projects' }) as Project[] | undefined
  const [expandedIndex, setExpandedIndex] = useState(0)

  const handleAdd = () => {
    const defaultProject: Project = {
      name: '',
      description: '',
      keywords: [],
      url: ''
    }

    append(defaultProject)
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
        const item = projects?.[index]
        const summaryDetail =
          item?.description || item?.keywords?.filter(Boolean).join(', ')

        return (
          <CollapsibleFormItem
            key={field.id}
            isExpanded={expandedIndex === index}
            onExpand={() => setExpandedIndex(index)}
            summaryTitle={item?.name || `Project ${index + 1}`}
            summaryDetail={summaryDetail}
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
            <RemoveButton
              type="button"
              disabled={fields.length === 1}
              onClick={() => handleRemove(index)}
            >
              - Remove Project
            </RemoveButton>
            <Divider />
          </CollapsibleFormItem>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Project
      </AddButton>
    </FormSection>
  )
}
