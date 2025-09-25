import { Input, InputProps } from './Input'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface Props extends Omit<InputProps, 'formContext'> {
  label: string
  className?: string
}

export function LabeledInput({ label, className, ...inputProps }: Props) {
  return (
    <div className={twMerge(clsx("flex flex-col mb-8 text-white last:mb-0", className))}>
      <label className="text-white mb-2">{label}</label>
      <Input {...inputProps} />
    </div>
  )
}
