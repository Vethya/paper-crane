import mongoose, { Schema, Document } from 'mongoose'
import type { StoredTailoring } from '@/lib/agentTailoring'

type AgentMode = 'Chat' | 'Feedback' | 'Tailoring'

export interface IAgentSessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

export interface IAgentSession extends Document {
  resumeId: string
  userId: string
  mode: AgentMode
  messages: IAgentSessionMessage[]
  /** Set while the server generates a reply, so a reopened chat can wait for it. */
  generatingSince?: Date
  /** Tailoring results the server saved, waiting for the user to review. */
  pendingEdits?: StoredTailoring
  createdAt: Date
  updatedAt: Date
}

const AgentSessionMessageSchema = new Schema<IAgentSessionMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    error: { type: Boolean }
  },
  { _id: false }
)

const AgentSessionSchema = new Schema<IAgentSession>(
  {
    resumeId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    mode: {
      type: String,
      enum: ['Chat', 'Feedback', 'Tailoring'],
      required: true
    },
    messages: { type: [AgentSessionMessageSchema], default: [] },
    generatingSince: { type: Date },
    pendingEdits: {
      type: new Schema(
        {
          summary: { type: String, required: true },
          edits: { type: [Schema.Types.Mixed], default: [] },
          status: {
            type: String,
            enum: ['ready', 'applied', 'dismissed'],
            required: true
          }
        },
        { _id: false, timestamps: true }
      )
    }
  },
  { timestamps: true }
)

export const AgentSession =
  mongoose.models.AgentSession ??
  mongoose.model<IAgentSession>('AgentSession', AgentSessionSchema)
