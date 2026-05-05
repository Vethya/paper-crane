import { Oxanium } from 'next/font/google'
import { twMerge } from 'tailwind-merge'

const oxanium = Oxanium({ subsets: ['latin'], weight: ['600'] })

interface Props {
  marginTop?: string | number
  marginBottom?: string | number
  marginLeft?: string | number
  marginRight?: string | number
  scale?: number
  className?: string
}

export function Logo({ scale = 1, className, ...props }: Props) {
  return (
    <span
      className={twMerge('select-none', className)}
      style={{
        fontFamily: oxanium.style.fontFamily,
        fontSize: `${24 * scale}px`,
        fontWeight: 600,
        letterSpacing: '0.02em',
        display: 'inline-block',
        lineHeight: 1.2,
        ...props
      }}
    >
      <span className="text-white">Resume </span>
      <span style={{ color: '#2563EB' }}>Manager</span>
    </span>
  )
}
