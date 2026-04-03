import { useState, CSSProperties, SyntheticEvent } from 'react'
import { StyledInput } from './Input'
import { MiniButton } from './Button'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface FormInputProps {
  onSubmit: (value: string) => void
  style?: CSSProperties
  className?: string
}

export function FormInput({ onSubmit, style, className }: FormInputProps) {
  const [value, setValue] = useState('')
  const normalizedValue = value.trim()
  const isDisabled = normalizedValue.length === 0

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault()
    if (isDisabled) {
      return
    }

    onSubmit(normalizedValue)
    setValue('')
  }

  return (
    <div
      className={twMerge(clsx("grid grid-cols-[1fr_auto_12px]", className))}
      style={style}
    >
      <StyledInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        className="col-span-3 pr-24"
      />
      <MiniButton
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled}
        className="col-start-2"
      >
        Add
      </MiniButton>
    </div>
  )
}
