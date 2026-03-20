import mongoose, { Schema, Document } from "mongoose";
import type { FormValues } from "@/types";

export interface IResume extends Document {
  userId: string;
  title: string;
  tags: string[];
  content: FormValues;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema(
  {
    address: String,
  },
  { _id: false }
);

const BasicsSchema = new Schema(
  {
    name: String,
    email: String,
    phone: String,
    website: String,
    location: LocationSchema,
  },
  { _id: false }
);

const WorkSchema = new Schema(
  {
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    location: String,
    highlights: [String],
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    institution: String,
    area: String,
    studyType: String,
    startDate: String,
    endDate: String,
    score: String,
    location: String,
  },
  { _id: false }
);

const AwardSchema = new Schema(
  {
    title: String,
    date: String,
    awarder: String,
    summary: String,
  },
  { _id: false }
);

const SkillSchema = new Schema(
  {
    name: String,
    keywords: [String],
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    name: String,
    description: String,
    url: String,
    keywords: [String],
  },
  { _id: false }
);

const ContentSchema = new Schema(
  {
    basics: { type: BasicsSchema },
    work: { type: [WorkSchema] },
    education: { type: [EducationSchema] },
    awards: { type: [AwardSchema] },
    skills: { type: [SkillSchema] },
    projects: { type: [ProjectSchema] },
    headings: {
      basics: String,
      work: String,
      education: String,
      awards: String,
      skills: String,
      projects: String,
    },
    sections: { type: [String] },
    selectedTemplate: { type: Number },
  },
  { _id: false }
);

const ResumeSchema = new Schema<IResume>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    tags: { type: [String], default: [] },
    content: { type: ContentSchema, required: true },
    templateId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Resume =
  mongoose.models.Resume ?? mongoose.model<IResume>("Resume", ResumeSchema);
