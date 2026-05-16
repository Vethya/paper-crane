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
import Keywords from './Keywords'
import {
  agentFocusedArrayEntryAtom,
  agentPendingEditsAtom,
  type NewEntryEdit,
  type RemoveEntryEdit
} from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Project } from '../../../../types'

export function ProjectsSection() {
  const focusedArrayEntry = useAtomValue(agentFocusedArrayEntryAtom)
  const {
    fields,
    expandedIndex,
    appendAndExpand,
    removeAndAdjustExpanded,
    toggleExpanded
  } = useCollapsibleFieldArray(
    'projects',
    focusedArrayEntry?.arrayPath === 'projects' ? focusedArrayEntry : null
  )
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

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
      {fields.length === 0 && (
        <Fragment>
          <p className="text-gray-400">No projects added yet.</p>
          <AddButton type="button" onClick={handleAdd}>
            + Add Project
          </AddButton>
        </Fragment>
      )}
      {fields.length > 0 && (
        <LabeledInput
          name="headings.projects"
          label="Section Heading"
          placeholder="Projects"
        />
      )}
      {fields.map((field, index) => {
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') &&
            e.arrayPath === 'projects' &&
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
            removeLabel="Remove project"
            summary={<ProjectSummary index={index} />}
          >
            <div data-array-path="projects" data-array-index={index}>
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
            </div>
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
