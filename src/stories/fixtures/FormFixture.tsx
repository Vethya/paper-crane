import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { FormValues } from '@/types'
import { resume } from './resume'

export function FormFixture({ children }: { children: ReactNode }) {
  const form = useForm<FormValues>({ defaultValues: resume })
  return <FormProvider {...form}>{children}</FormProvider>
}
