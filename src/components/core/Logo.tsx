import { twMerge } from 'tailwind-merge'

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
      className={twMerge(
        'inline-block select-none whitespace-nowrap font-sans text-[rgb(var(--app-foreground))]',
        className
      )}
      style={{
        fontSize: `${24 * scale}px`,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        lineHeight: 1.2,
        ...props
      }}
    >
      Paper Crane
    </span>
  )
}
