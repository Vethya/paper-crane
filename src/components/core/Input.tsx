import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { FieldPath, useFormContext } from 'react-hook-form'
import { FormValues } from '../../types'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

const fieldClasses =
  'w-full rounded-app-button border border-app-border bg-app-control px-3 py-2 text-sm text-white transition-[border-color,background-color,box-shadow] placeholder:text-app-textMuted/70 hover:border-app-controlBorder focus:border-app-borderStrong focus:bg-transparent focus:outline-none focus:ring-[3px] focus:ring-white/[0.06] disabled:opacity-50'

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function StyledInput({ className, ...props }: StyledInputProps) {
  return <input className={twMerge(clsx(fieldClasses, className))} {...props} />
}

interface StyledTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function StyledTextarea({ className, ...props }: StyledTextareaProps) {
  return (
    <textarea
      className={twMerge(
        clsx(fieldClasses, 'min-h-24 resize-y leading-relaxed', className)
      )}
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
