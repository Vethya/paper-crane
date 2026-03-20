import mongoose, { Schema, Document } from "mongoose";
import type { FormValues } from "@/types";

export interface IResume extends Document {
  userId: string;
  title: string;
  content: FormValues;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema(
  {
    address: String,
    postalCode: String,
    city: String,
    countryCode: String,
    region: String,
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    url: String,
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
    profiles: [ProfileSchema],
  },
  { _id: false }
);

const WorkSchema = new Schema(
  {
    name: String,
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    summary: String,
    location: String,
    highlights: [String],
  },
  { _id: false }
);

const VolunteerSchema = new Schema(
  {
    organization: String,
    position: String,
    startDate: String,
    endDate: String,
    summary: String,
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

const PublicationSchema = new Schema(
  {
    name: String,
    publisher: String,
    releaseDate: String,
    url: String,
    summary: String,
  },
  { _id: false }
);

const SkillSchema = new Schema(
  {
    name: String,
    level: String,
    keywords: [String],
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    name: String,
    description: String,
    url: String,
    startDate: String,
    endDate: String,
    highlights: [String],
    keywords: [String],
  },
  { _id: false }
);

const ContentSchema = new Schema(
  {
    basics: { type: BasicsSchema },
    work: { type: [WorkSchema] },
    volunteer: { type: [VolunteerSchema] },
    education: { type: [EducationSchema] },
    awards: { type: [AwardSchema] },
    publications: { type: [PublicationSchema] },
    skills: { type: [SkillSchema] },
    projects: { type: [ProjectSchema] },
    headings: {
      basics: String,
      work: String,
      volunteer: String,
      education: String,
      awards: String,
      publications: String,
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
    content: { type: ContentSchema, required: true },
    templateId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Resume =
  mongoose.models.Resume ?? mongoose.model<IResume>("Resume", ResumeSchema);
