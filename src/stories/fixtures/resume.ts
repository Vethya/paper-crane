import type { ResumeComponent } from '@/lib/resumeComponents'
import type { FormValues } from '@/types'

export const workComponent = {
  _id: 'work-northstar',
  type: 'work',
  content: {
    company: 'Northstar Labs',
    position: 'Senior Frontend Engineer',
    location: 'Seattle, WA',
    startDate: 'Sep 2021',
    endDate: 'Present',
    highlights: ['Reduced dashboard load time by 38% for 12,000 customers.']
  }
} satisfies ResumeComponent<'work'>

export const resume = {
  basics: { name: 'Jordan Diaz', email: 'jordan@example.com' },
  work: [workComponent.content],
  skills: [
    { name: 'Frontend', keywords: ['React', 'TypeScript', 'Accessibility'] }
  ],
  headings: {},
  sections: ['profile', 'work', 'skills'],
  selectedTemplate: 1
} satisfies FormValues
