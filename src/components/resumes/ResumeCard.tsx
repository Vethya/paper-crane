'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiFileText, FiMoreVertical, FiTrash2 } from 'react-icons/fi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { tagColorMap, type TagColor } from '@/lib/tagColors'

interface TagItem {
  _id: string
  name: string
  color: TagColor
}

interface ResumeCardProps {
  id: string
  title: string
  tags?: string[]
  tagMap?: Record<string, TagItem>
  updatedAt: string
  onDelete?: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ResumeCard({
  id,
  title,
  tags,
  tagMap,
  updatedAt,
  onDelete
}: ResumeCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
    onDelete?.(id)
  }

  return (
    <>
      <Link
        href={`/generator?id=${id}`}
        className="group relative flex min-h-[8.5rem] flex-col gap-3 rounded-app-card border border-app-border bg-app-surface p-4 transition-colors hover:border-app-controlBorder hover:bg-app-surfaceElevated"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-app-button bg-app-control text-slate-400">
              <FiFileText size={16} />
            </span>
            <span className="line-clamp-2 font-medium leading-snug text-white">
              {title}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                disabled={deleting}
                aria-label={`Actions for ${title}`}
                className="flex h-7 w-7 items-center justify-center rounded-app-button text-slate-400 opacity-0 transition hover:bg-app-controlHover hover:text-white focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:bg-app-controlHover data-[state=open]:text-white data-[state=open]:opacity-100"
              >
                <FiMoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="min-w-[130px] rounded-app-card border border-app-controlBorder bg-app-surface py-1 shadow-xl"
            >
              <DropdownMenuItem
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 transition hover:bg-app-control focus:bg-app-control focus:text-red-400 cursor-pointer"
              >
                <FiTrash2 size={13} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const color = tagMap?.[tag]?.color ?? 'gray'
              const { badgeBg, badgeText } = tagColorMap[color]
              return (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-0.5 text-xs"
                  style={{ backgroundColor: badgeBg, color: badgeText }}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        )}

        <p className="mt-auto text-xs text-slate-500">
          Updated {timeAgo(updatedAt)}
        </p>
      </Link>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="border border-app-border bg-app-surface text-slate-100 max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Delete resume?</DialogTitle>
            <DialogDescription className="text-slate-400">
              &ldquo;{title}&rdquo; will be permanently deleted. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="rounded-app-button border border-app-controlBorder bg-app-control px-4 py-2 text-sm text-white transition hover:bg-app-controlHover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-app-button bg-red-600 px-4 py-2 text-sm font-medium text-[rgb(255_255_255)] transition hover:bg-red-500 hover:text-[rgb(255_255_255)] focus:text-[rgb(255_255_255)] disabled:text-[rgb(255_255_255)] disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
