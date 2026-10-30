import type { Decorator } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { FormValues } from '@/types'
import { resume, fullResume } from './resume'

export function FormFixture({
  children,
  values = resume
}: {
  children: ReactNode
  values?: FormValues
}) {
  const form = useForm<FormValues>({ defaultValues: values })
  return <FormProvider {...form}>{children}</FormProvider>
}

export const withForm: Decorator = (Story, { parameters }) => (
  <FormFixture
    values={
      parameters.empty
        ? { headings: {}, sections: [], selectedTemplate: 1 }
        : fullResume
    }
  >
    <Story />
  </FormFixture>
)
