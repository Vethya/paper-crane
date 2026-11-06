import mongoose from 'mongoose'
import { z } from 'zod'
import { TAG_COLORS } from './tagColors'

const nonEmpty = z.string().trim().min(1, 'must not be empty')
const objectId = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), 'Invalid ID format')

// Imported JSON Resume files may hold numbers or nulls in text fields.
// Mongoose stores those as strings, so accept them as before.
const text = z.union([z.string(), z.number()]).nullish()
const textList = z.array(z.string()).nullish()

const list = <T extends z.ZodRawShape>(shape: T) =>
  z.array(z.object(shape)).nullish()

const SECTIONS = [
  'profile',
  'education',
  'work',
  'skills',
  'projects',
  'awards'
] as const

/** Mirrors the Mongoose resume content schema; unknown keys are dropped. */
export const ResumeContentSchema = z.object({
  basics: z
    .object({
      name: text,
      email: text,
      phone: text,
      website: text,
      location: z.object({ address: text }).nullish()
    })
    .nullish(),
  work: list({
    company: text,
    position: text,
    startDate: text,
    endDate: text,
    location: text,
    highlights: textList
  }),
  education: list({
    institution: text,
    area: text,
    studyType: text,
    startDate: text,
    endDate: text,
    score: text,
    location: text
  }),
  awards: list({ title: text, date: text, awarder: text, summary: text }),
  skills: list({ name: text, keywords: textList }),
  projects: list({
    name: text,
    description: text,
    url: text,
    keywords: textList
  }),
  headings: z
    .object({
      basics: text,
      work: text,
      education: text,
      awards: text,
      skills: text,
      projects: text
    })
    .nullish(),
  sections: z.array(z.enum(SECTIONS)).nullish(),
  selectedTemplate: z.number().int().nullish()
})

export const CreateResumeSchema = z.object({
  title: nonEmpty,
  content: ResumeContentSchema.optional()
})

export const UpdateResumeSchema = z.object({
  title: nonEmpty.optional(),
  content: ResumeContentSchema.optional(),
  tags: z.array(z.string()).optional(),
  // parseWriter checks it; a bad value only skips the stale-save check.
  writer: z.unknown().optional()
})

const TagColorSchema = z.enum(TAG_COLORS)

export const CreateTagSchema = z.object({
  name: nonEmpty,
  color: TagColorSchema.default('gray')
})

export const UpdateTagSchema = z.object({
  name: nonEmpty.optional(),
  color: TagColorSchema.optional()
})

/** The form values that the LaTeX source ZIP is built from. */
export const SourceZipSchema = ResumeContentSchema.extend({
  selectedTemplate: z.number().int()
})

const AgentModeSchema = z.enum(['Chat', 'Feedback', 'Tailoring'])

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
})

export const AgentChatSchema = z.object({
  messages: z.array(ChatMessageSchema),
  mode: AgentModeSchema
})

export const AgentEditSchema = z.object({
  messages: z.array(ChatMessageSchema),
  resumeData: z.record(z.string(), z.unknown())
})

export const SaveAgentSessionSchema = z.object({
  resumeId: objectId,
  sessionId: objectId.nullish(),
  mode: AgentModeSchema,
  // The session model requires a non-empty id and content.
  messages: z.array(
    ChatMessageSchema.extend({
      id: z.string().min(1),
      content: z.string().min(1)
    })
  )
})

/** Component type and content are checked by the resumeComponents helpers. */
export const ComponentBodySchema = z.object({
  type: z.unknown(),
  content: z.unknown()
})
