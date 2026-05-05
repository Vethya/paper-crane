'use client'

import { useEffect, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { TAG_COLORS, TagColor, tagColorMap } from '@/lib/tagColors'

export interface TagItem {
  _id: string
  name: string
  color: TagColor
}

interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTag?: TagItem
  initialName?: string
  onCreated?: (tag: TagItem) => void
  onUpdated?: (tag: TagItem) => void
  onDeleted?: (tagId: string) => void
}

export function TagDialog({
  open,
  onOpenChange,
  editTag,
  initialName,
  onCreated,
  onUpdated,
  onDeleted
}: TagDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<TagColor>('gray')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(editTag?.name ?? initialName ?? '')
      setColor(editTag?.color ?? 'gray')
    }
  }, [open, editTag, initialName])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editTag) {
        const res = await fetch(`/api/tags/${editTag._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), color })
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        onUpdated?.(updated)
      } else {
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), color })
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        onCreated?.(created)
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editTag) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tags/${editTag._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted?.(editTag._id)
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border border-app-border bg-app-surface text-slate-100 max-w-xs"
      >
        <DialogHeader>
          <DialogTitle className="text-white text-sm">
            {editTag ? 'Edit tag' : 'Create tag'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            placeholder="Tag name"
            autoFocus
            className="rounded-app-button border border-app-controlBorder bg-app-control px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-app-borderStrong"
          />

          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                style={{ backgroundColor: tagColorMap[c].hex }}
                className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white/60 scale-110' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {editTag ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-sm text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
            >
              <FiTrash2 size={13} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-app-button border border-app-controlBorder bg-app-control px-3 py-1.5 text-xs text-white transition-colors hover:bg-app-controlHover"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-app-button border border-white/90 bg-white px-3 py-1.5 text-xs font-medium text-app-background transition-colors hover:bg-app-primaryHover disabled:opacity-50"
            >
              {saving ? 'Saving…' : editTag ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
