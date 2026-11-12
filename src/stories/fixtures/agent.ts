import type {
  FieldEdit,
  NewEntryEdit,
  RemoveEntryEdit
} from '@/atoms/agentEdits'
import type { AgentMessage } from '@/atoms/agentAtom'
import { resume, workComponent } from './resume'

export const positionEdit: FieldEdit = {
  id: 'position',
  type: 'set',
  fieldPath: 'work.0.position',
  originalValue: 'Frontend Engineer',
  newValue: 'Senior Frontend Engineer',
  reason: 'Match the seniority of the target role.',
  status: 'pending'
}
export const entryEdit: NewEntryEdit = {
  id: 'append-work',
  type: 'append',
  arrayPath: 'work',
  entryIndex: 1,
  entry: { ...workComponent.content, _agentEditId: 'append-work' },
  reason: 'Include relevant frontend platform experience.',
  status: 'pending'
}
export const removeEdit: RemoveEntryEdit = {
  ...entryEdit,
  id: 'remove-work',
  type: 'remove',
  entryIndex: 0
}
export const appendedResume = {
  ...resume,
  work: [
    ...resume.work,
    { ...workComponent.content, _agentEditId: entryEdit.id }
  ]
}
export const messages: AgentMessage[] = [
  {
    id: 'user',
    role: 'user',
    content: 'How can I strengthen my frontend resume?'
  },
  {
    id: 'reply',
    role: 'assistant',
    content:
      'Lead with **measurable impact**, then explain your React platform work.'
  }
]
