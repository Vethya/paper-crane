import mongoose, { Schema, Document } from 'mongoose'
import type { TagColor } from '@/lib/tagColors'

export interface ITag extends Document {
  userId: string
  name: string
  color: TagColor
}

const TagSchema = new Schema<ITag>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: 'gray' }
  },
  { timestamps: true }
)

export const Tag = mongoose.models.Tag ?? mongoose.model<ITag>('Tag', TagSchema)
