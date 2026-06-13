import mongoose, { Document, Schema } from 'mongoose'
import type {
  ResumeComponentContent,
  ResumeComponentType
} from '@/lib/resumeComponents'

export interface IResumeComponent extends Document {
  userId: string
  type: ResumeComponentType
  content: ResumeComponentContent
  fingerprint: string
  createdAt: Date
  updatedAt: Date
}

const WorkSchema = new Schema(
  {
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    location: String,
    highlights: [String]
  },
  { _id: false }
)

const EducationSchema = new Schema(
  {
    institution: String,
    area: String,
    studyType: String,
    startDate: String,
    endDate: String,
    score: String,
    location: String
  },
  { _id: false }
)

const AwardSchema = new Schema(
  {
    title: String,
    date: String,
    awarder: String,
    summary: String
  },
  { _id: false }
)

const SkillSchema = new Schema(
  {
    name: String,
    keywords: [String]
  },
  { _id: false }
)

const ProjectSchema = new Schema(
  {
    name: String,
    description: String,
    url: String,
    keywords: [String]
  },
  { _id: false }
)

const contentSchemaByType = {
  education: EducationSchema,
  work: WorkSchema,
  skills: SkillSchema,
  projects: ProjectSchema,
  awards: AwardSchema
}

const ResumeComponentSchema = new Schema<IResumeComponent>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['education', 'work', 'skills', 'projects', 'awards'],
      index: true
    },
    content: {
      type: Schema.Types.Mixed,
      required: true
    },
    fingerprint: { type: String, required: true }
  },
  { timestamps: true }
)

ResumeComponentSchema.index({ userId: 1, fingerprint: 1 }, { unique: true })

ResumeComponentSchema.path('content').validate(function (
  this: IResumeComponent,
  value: ResumeComponentContent
) {
  const schema = contentSchemaByType[this.type]
  return !!schema && !!value
})

export const ResumeComponent =
  mongoose.models.ResumeComponent ??
  mongoose.model<IResumeComponent>('ResumeComponent', ResumeComponentSchema)
