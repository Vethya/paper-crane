import Link from 'next/link'
import { Logo } from '../core/Logo'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={twMerge(clsx("w-full h-16 flex justify-center items-center border-b", className))} style={{ borderColor: '#374151' }}>
      <Link href="/">
        <Logo />
      </Link>
    </header>
  )
}
