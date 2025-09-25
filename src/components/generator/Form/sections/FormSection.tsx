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
    <fieldset className={twMerge(clsx("w-full px-8 pb-8", className))}>
      <h2 className="my-6 text-xl tracking-wider uppercase">{title}</h2>
      {children}
    </fieldset>
  )
}
