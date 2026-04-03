import { Fragment } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useAtomValue } from 'jotai'

import { LabeledInput } from '../../../core/LabeledInput'
import { AddButton, RemoveButton } from '../../../core/Button'
import { Divider } from '../../../core/Divider'
import { FormSection } from './FormSection'
import Keywords from './Keywords'
import { agentPendingEditsAtom, type NewEntryEdit, type RemoveEntryEdit } from '../../../../atoms/agentEdits'
import { AgentEntryEditControls } from '../../../agent/AgentEntryEditControls'

import { Project } from '../../../../types'

export function ProjectsSection() {
  const { fields, append, remove } = useFieldArray({ name: 'projects' })
  const pendingEdits = useAtomValue(agentPendingEditsAtom)

  const handleAdd = () => {
    const defaultProject: Project = {
      name: '',
      description: '',
      keywords: [],
      url: ''
    }

    append(defaultProject)
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
        const entryEdit = pendingEdits.find(
          (e): e is NewEntryEdit | RemoveEntryEdit =>
            (e.type === 'append' || e.type === 'remove') && e.arrayPath === 'projects' && e.entryIndex === index && e.status === 'pending'
        )
        return (
          <div key={field.id}>
            <div
              data-array-path="projects"
              data-array-index={index}
              className={entryEdit
                ? entryEdit.type === 'remove'
                  ? 'rounded-lg ring-2 ring-rose-400/70 shadow-[0_0_0_3px_rgba(251,113,133,0.12)]'
                  : 'rounded-lg ring-2 ring-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                : undefined}
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
                onClick={() => remove(index)}
              >
                - Remove Project
              </RemoveButton>
            </div>
            {entryEdit && <AgentEntryEditControls edit={entryEdit} />}
            <Divider />
          </div>
        )
      })}
      <AddButton type="button" onClick={handleAdd}>
        + Add Project
      </AddButton>
    </FormSection>
  )
}
