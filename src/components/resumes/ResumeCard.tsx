"use client"

import Link from "next/link"
import { FiFileText } from "react-icons/fi"

interface ResumeCardProps {
  id: string
  title: string
  tags?: string[]
  updatedAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ResumeCard({ id, title, tags, updatedAt }: ResumeCardProps) {
  return (
    <Link
      href={`/generator?id=${id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-blue-500/40 hover:bg-slate-900/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
            <FiFileText size={18} />
          </span>
          <span className="font-medium text-slate-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {title}
          </span>
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-auto text-xs text-slate-500">Updated {timeAgo(updatedAt)}</p>
    </Link>
  )
}
