import { ReactNode } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface Props {
  title?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title = '', children, className }: Props) {
  return (
    <fieldset className={twMerge(clsx('w-full px-6 pb-8', className))}>
      <h2 className="pb-5 pt-6 text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </fieldset>
  )
}
