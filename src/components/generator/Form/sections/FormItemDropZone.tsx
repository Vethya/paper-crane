import { HTMLAttributes } from 'react'
import clsx from 'clsx'

type FormItemDropZoneSize = 'normal' | 'spacious' | 'empty'

type FormItemDropZoneProps = {
  active: boolean
  size?: FormItemDropZoneSize
} & HTMLAttributes<HTMLDivElement>

export function FormItemDropZone({
  active,
  size = 'normal',
  ...props
}: FormItemDropZoneProps) {
  if (size === 'empty') {
    return (
      <div
        {...props}
        className={clsx(
          'my-3 flex min-h-24 items-center rounded-app-card border border-dashed transition',
          active
            ? 'border-emerald-400/70 bg-emerald-400/5'
            : 'border-app-controlBorder bg-transparent'
        )}
      >
        <DropIndicator active={active} />
      </div>
    )
  }

  return (
    <div className="relative my-1 h-4">
      <div
        {...props}
        className={clsx(
          'absolute left-0 right-0 z-10 flex items-center',
          size === 'spacious' ? '-top-10 -bottom-2' : '-top-6 -bottom-1'
        )}
      >
        <DropIndicator active={active} />
      </div>
    </div>
  )
}

function DropIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={clsx(
        'h-0.5 w-full rounded-full transition',
        active ? 'bg-emerald-400/90' : 'bg-transparent'
      )}
    />
  )
}
