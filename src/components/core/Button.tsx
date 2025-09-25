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
          "flex justify-center items-center font-inherit text-sm text-center no-underline w-[175px] h-[45px] my-[7px] bg-transparent text-white rounded-full border border-green-500/90 shadow-none hover:bg-gradient-to-r hover:from-green-600/55 hover:to-green-500/70 hover:cursor-pointer focus:outline-none active:shadow-lg active:border-green-500/85 active:text-green-500/85",
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
          "flex justify-center items-center font-inherit text-sm text-center no-underline w-[175px] h-[45px] my-[7px] text-white rounded-full border-none bg-gradient-to-r from-green-600/70 to-green-500 shadow-none hover:bg-gradient-to-r hover:from-green-700/60 hover:to-green-500 hover:cursor-pointer focus:outline-none active:shadow-lg active:border-green-500/85 active:text-green-500/85",
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
          "px-3 py-2 cursor-pointer outline-none border-none bg-transparent text-green-500 hover:cursor-pointer focus:outline-none",
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
