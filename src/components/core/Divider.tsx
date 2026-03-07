import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface DividerProps {
  className?: string
}

export function Divider({ className }: DividerProps) {
  return (
    <hr
      className={twMerge(clsx(
        "my-6 bg-blue-600 h-1 border-none",
        className
      ))}
    />
  )
}
