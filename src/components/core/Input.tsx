import { InputHTMLAttributes } from 'react'
import { FieldPath, useFormContext } from 'react-hook-form'
import { FormValues } from '../../types'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function StyledInput({ className, ...props }: StyledInputProps) {
  return (
    <input
      className={twMerge(
        clsx(
          "bg-transparent p-4 text-white text-sm rounded focus:outline focus:outline-1 focus:outline-green-500 placeholder:text-slate-400 placeholder:opacity-50",
          className
        )
      )}
      style={{ border: '1px solid #4b5563' }}
      {...props}
    />
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: FieldPath<FormValues>
}

export function Input({ name, ...inputProps }: InputProps) {
  const formContext = useFormContext<FormValues>()
  return <StyledInput {...inputProps} {...formContext.register(name)} />
}
