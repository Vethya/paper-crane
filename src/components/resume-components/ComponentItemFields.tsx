'use client'

import { LabeledInput } from '@/components/core/LabeledInput'
import Highlights from '@/components/generator/Form/sections/Highlights'
import Keywords from '@/components/generator/Form/sections/Keywords'
import type { ResumeComponentType } from '@/lib/resumeComponents'

interface ComponentItemFieldsProps {
  type: ResumeComponentType
  index: number
}

export function ComponentItemFields({ type, index }: ComponentItemFieldsProps) {
  if (type === 'education') {
    return (
      <>
        <LabeledInput
          name={`education.${index}.institution`}
          label="School name"
          placeholder="Rutgers University"
        />
        <LabeledInput
          name={`education.${index}.location`}
          label="School Location"
          placeholder="New Brunswick, NJ"
        />
        <LabeledInput
          name={`education.${index}.studyType`}
          label="Degree"
          placeholder="Bachelor's"
        />
        <LabeledInput
          name={`education.${index}.area`}
          label="Major"
          placeholder="Computer Science"
        />
        <LabeledInput
          name={`education.${index}.score`}
          label="GPA"
          placeholder="3.8"
        />
        <LabeledInput
          name={`education.${index}.startDate`}
          label="Start Date"
          placeholder="Sep 2015"
        />
        <LabeledInput
          name={`education.${index}.endDate`}
          label="End Date"
          placeholder="Jun 2019"
        />
      </>
    )
  }

  if (type === 'work') {
    return (
      <>
        <LabeledInput
          name={`work.${index}.company`}
          label="Company name"
          placeholder="Netflix"
        />
        <LabeledInput
          name={`work.${index}.location`}
          label="Location"
          placeholder="Los Gatos, CA"
        />
        <LabeledInput
          name={`work.${index}.position`}
          label="Position"
          placeholder="Software Engineer"
        />
        <LabeledInput
          name={`work.${index}.startDate`}
          label="Start Date"
          placeholder="Sep 2015"
        />
        <LabeledInput
          name={`work.${index}.endDate`}
          label="End Date"
          placeholder="Jun 2019"
        />
        <Highlights
          label="Job Responsibilities"
          placeholder="Did cool stuff at company"
          name={`work.${index}.highlights`}
        />
      </>
    )
  }

  if (type === 'skills') {
    return (
      <>
        <LabeledInput
          name={`skills.${index}.name`}
          label="Skill name"
          placeholder="Programming Languages"
        />
        <Keywords
          label="Skill Details"
          placeholder="TypeScript"
          name={`skills.${index}.keywords`}
        />
      </>
    )
  }

  if (type === 'projects') {
    return (
      <>
        <LabeledInput
          name={`projects.${index}.name`}
          label="Project Name"
          placeholder="Piper Chat"
        />
        <LabeledInput
          name={`projects.${index}.description`}
          label="Project Description"
          placeholder="A video chat app with great picture quality."
          multiline
          textareaRows={4}
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
      </>
    )
  }

  return (
    <>
      <LabeledInput
        name={`awards.${index}.title`}
        label="Award Name"
        placeholder="Supreme hacker"
      />
      <LabeledInput
        name={`awards.${index}.date`}
        label="Award Date"
        placeholder="May 2015"
      />
      <LabeledInput
        name={`awards.${index}.awarder`}
        label="Awarder"
        placeholder="HackNY"
      />
      <LabeledInput
        name={`awards.${index}.summary`}
        label="Summary"
        placeholder="Recognized for creating the most awesome project at a hackathon."
        multiline
        textareaRows={4}
      />
    </>
  )
}
