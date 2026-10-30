import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

// Base button styles using Tailwind classes
interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function Button({ children, className, ...props }: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'flex h-9 items-center justify-center gap-2 rounded-app-button border border-app-border bg-app-control px-4 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-app-controlHover',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  children,
  className,
  ...props
}: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'flex h-10 items-center justify-center gap-2 rounded-app-button bg-white px-4 text-sm font-semibold tracking-wide text-app-background transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-background hover:bg-app-primaryHover disabled:cursor-not-allowed disabled:bg-app-control disabled:text-app-textMuted',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function MiniButton({ children, className, ...props }: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'flex justify-center items-center font-inherit text-sm font-medium text-center no-underline px-3 py-1 text-white rounded-md border-none hover:cursor-pointer hover:bg-app-controlHover focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function AddButton({ children, className, ...props }: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-app-button px-2.5 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-app-control hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function RemoveButton({
  children,
  className,
  ...props
}: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'px-3 py-2 cursor-pointer outline-none border-none bg-transparent text-red-500 hover:cursor-pointer focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({ children, className, ...props }: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          'flex items-center outline-none border-none bg-transparent text-white rounded hover:bg-app-controlHover focus:bg-app-controlHover focus:outline-none',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}
