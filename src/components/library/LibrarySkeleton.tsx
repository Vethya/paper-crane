import { Logo } from '@/components/core/Logo'
import { Skeleton } from '@/components/ui/skeleton'

export function CardSkeletons({
  label = 'Loading items',
  count = 3
}: {
  label?: string
  count?: number
}) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="space-y-4 rounded-app-card border border-app-border bg-app-surface p-4"
        >
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function LibrarySkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-app-background text-slate-100">
      <div className="flex h-14 items-center border-b border-app-border px-3 sm:px-6">
        <Logo />
      </div>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        <CardSkeletons label={`Loading ${title.toLowerCase()}`} />
      </main>
    </div>
  )
}
