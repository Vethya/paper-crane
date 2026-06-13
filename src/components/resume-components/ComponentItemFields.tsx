'use client'

import { LabeledInput } from '@/components/core/LabeledInput'
import Highlights from '@/components/generator/Form/sections/Highlights'
import Keywords from '@/components/generator/Form/sections/Keywords'
import type { ResumeComponentType } from '@/lib/resumeComponents'

interface ComponentItemFieldsProps {
  type: ResumeComponentType
  index: number
  invalidFieldName?: string | null
}

export function ComponentItemFields({
  type,
  index,
  invalidFieldName
}: ComponentItemFieldsProps) {
  const fieldClassName = 'mb-0'
  const isInvalid = (fieldName: string) => invalidFieldName === fieldName

  if (type === 'education') {
    return (
      <div className="space-y-6">
        <LabeledInput
          name={`education.${index}.institution`}
          label="School name"
          placeholder="Rutgers University"
          className={fieldClassName}
          invalid={isInvalid('institution')}
        />
        <LabeledInput
          name={`education.${index}.location`}
          label="School Location"
          placeholder="New Brunswick, NJ"
          className={fieldClassName}
        />
        <LabeledInput
          name={`education.${index}.studyType`}
          label="Degree"
          placeholder="Bachelor's"
          className={fieldClassName}
        />
        <LabeledInput
          name={`education.${index}.area`}
          label="Major"
          placeholder="Computer Science"
          className={fieldClassName}
        />
        <LabeledInput
          name={`education.${index}.score`}
          label="GPA"
          placeholder="3.8"
          className={fieldClassName}
        />
        <LabeledInput
          name={`education.${index}.startDate`}
          label="Start Date"
          placeholder="Sep 2015"
          className={fieldClassName}
        />
        <LabeledInput
          name={`education.${index}.endDate`}
          label="End Date"
          placeholder="Jun 2019"
          className={fieldClassName}
        />
      </div>
    )
  }

  if (type === 'work') {
    return (
      <div className="space-y-6">
        <LabeledInput
          name={`work.${index}.company`}
          label="Company name"
          placeholder="Netflix"
          className={fieldClassName}
          invalid={isInvalid('company')}
        />
        <LabeledInput
          name={`work.${index}.location`}
          label="Location"
          placeholder="Los Gatos, CA"
          className={fieldClassName}
        />
        <LabeledInput
          name={`work.${index}.position`}
          label="Position"
          placeholder="Software Engineer"
          className={fieldClassName}
        />
        <LabeledInput
          name={`work.${index}.startDate`}
          label="Start Date"
          placeholder="Sep 2015"
          className={fieldClassName}
        />
        <LabeledInput
          name={`work.${index}.endDate`}
          label="End Date"
          placeholder="Jun 2019"
          className={fieldClassName}
        />
        <Highlights
          label="Job Responsibilities"
          placeholder="Did cool stuff at company"
          name={`work.${index}.highlights`}
          className={fieldClassName}
        />
      </div>
    )
  }

  if (type === 'skills') {
    return (
      <div className="space-y-6">
        <LabeledInput
          name={`skills.${index}.name`}
          label="Skill name"
          placeholder="Programming Languages"
          className={fieldClassName}
          invalid={isInvalid('name')}
        />
        <Keywords
          label="Skill Details"
          placeholder="TypeScript"
          name={`skills.${index}.keywords`}
          className={fieldClassName}
        />
      </div>
    )
  }

  if (type === 'projects') {
    return (
      <div className="space-y-6">
        <LabeledInput
          name={`projects.${index}.name`}
          label="Project Name"
          placeholder="Piper Chat"
          className={fieldClassName}
          invalid={isInvalid('name')}
        />
        <LabeledInput
          name={`projects.${index}.description`}
          label="Project Description"
          placeholder="A video chat app with great picture quality."
          multiline
          textareaRows={4}
          className={fieldClassName}
        />
        <LabeledInput
          name={`projects.${index}.url`}
          label="Link to Project"
          placeholder="http://piperchat.com"
          className={fieldClassName}
        />
        <Keywords
          label="Tools Used"
          placeholder="TypeScript"
          name={`projects.${index}.keywords`}
          className={fieldClassName}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <LabeledInput
        name={`awards.${index}.title`}
        label="Award Name"
        placeholder="Supreme hacker"
        className={fieldClassName}
        invalid={isInvalid('title')}
      />
      <LabeledInput
        name={`awards.${index}.date`}
        label="Award Date"
        placeholder="May 2015"
        className={fieldClassName}
      />
      <LabeledInput
        name={`awards.${index}.awarder`}
        label="Awarder"
        placeholder="HackNY"
        className={fieldClassName}
      />
      <LabeledInput
        name={`awards.${index}.summary`}
        label="Summary"
        placeholder="Recognized for creating the most awesome project at a hackathon."
        multiline
        textareaRows={4}
        className={fieldClassName}
      />
    </div>
  )
}
