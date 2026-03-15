import mongoose, { Schema, Document } from "mongoose";

export interface IResume extends Document {
  userId: string;
  title: string;
  content: Record<string, unknown>;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    templateId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Resume =
  mongoose.models.Resume ?? mongoose.model<IResume>("Resume", ResumeSchema);
