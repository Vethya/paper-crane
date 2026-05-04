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
          'flex h-11 min-w-[175px] items-center justify-center rounded-full border border-app-controlBorder bg-app-control px-5 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-app-borderStrong hover:bg-app-controlHover',
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
          'flex h-11 min-w-[175px] items-center justify-center rounded-full border border-white/90 bg-white px-5 text-sm font-semibold text-app-background shadow-[0_18px_45px_-25px_rgba(255,255,255,0.35)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-background hover:bg-zinc-200 disabled:border-app-border disabled:bg-app-surfaceElevated disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-60',
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
          'flex justify-center items-center font-inherit text-sm text-center no-underline px-6 py-[6px] text-white rounded border-none hover:cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-40',
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
          'px-3 py-2 cursor-pointer outline-none border-none bg-transparent text-slate-100 hover:cursor-pointer focus:outline-none',
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
