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
          "flex h-11 min-w-[175px] items-center justify-center rounded-full border border-blue-500/70 bg-transparent px-5 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-0 hover:border-blue-400/80 hover:text-blue-300",
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({ children, className, ...props }: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          "flex h-11 min-w-[175px] items-center justify-center rounded-full border-none bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-sm font-semibold text-white shadow-[0_18px_45px_-25px_rgba(37,99,235,0.75)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 hover:from-blue-600/90 hover:to-blue-500/90",
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
          "flex justify-center items-center font-inherit text-sm text-center no-underline px-6 py-[6px] text-white rounded border-none hover:cursor-pointer focus:outline-none",
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
          "px-3 py-2 cursor-pointer outline-none border-none bg-transparent text-blue-500 hover:cursor-pointer focus:outline-none",
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function RemoveButton({ children, className, ...props }: BaseButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          "px-3 py-2 cursor-pointer outline-none border-none bg-transparent text-red-500 hover:cursor-pointer focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed",
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
          "flex items-center outline-none border-none bg-transparent text-white rounded hover:bg-slate-700 focus:bg-slate-700 focus:outline-none",
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  )
}
