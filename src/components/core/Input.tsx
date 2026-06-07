import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { FieldPath, useFormContext } from 'react-hook-form'
import { FormValues } from '../../types'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

const fieldClasses =
  'w-full bg-transparent p-4 text-white text-sm rounded focus:outline focus:outline-1 focus:outline-green-500 placeholder:text-slate-400 placeholder:opacity-50'
const fieldStyle = { border: '1px solid #4b5563' }

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function StyledInput({ className, ...props }: StyledInputProps) {
  return (
    <input
      className={twMerge(clsx(fieldClasses, className))}
      style={fieldStyle}
      {...props}
    />
  )
}

interface StyledTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function StyledTextarea({ className, ...props }: StyledTextareaProps) {
  return (
    <textarea
      className={twMerge(
        clsx(fieldClasses, 'min-h-28 resize-y leading-relaxed', className)
      )}
      style={fieldStyle}
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

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: FieldPath<FormValues>
}

export function Textarea({ name, ...textareaProps }: TextareaProps) {
  const formContext = useFormContext<FormValues>()
  return <StyledTextarea {...textareaProps} {...formContext.register(name)} />
}
