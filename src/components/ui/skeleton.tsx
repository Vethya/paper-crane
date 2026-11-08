import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-app-button bg-app-control motion-reduce:animate-none',
        className
      )}
    />
  )
}

export function FormSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading resume"
      aria-busy="true"
      className="space-y-6 p-6"
    >
      <Skeleton className="h-6 w-36" />
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading resume</span>
    </div>
  )
}
