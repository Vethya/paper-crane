'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import { FiCheck, FiEdit2, FiPlus, FiTag } from 'react-icons/fi'
import { resumeTagsAtom } from '@/atoms/resumeTags'
import { saveStateAtom } from '@/atoms/saveState'
import { TagDialog, type TagItem } from './TagDialog'
import { tagColorMap } from '@/lib/tagColors'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'

export function TagPicker() {
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('id')

  const [resumeTags, setResumeTags] = useAtom(resumeTagsAtom)
  const [allTags, setAllTags] = useState<TagItem[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagItem | undefined>()
  const [initialName, setInitialName] = useState('')
  const setSaveState = useSetAtom(saveStateAtom)

  const containerRef = useRef<HTMLDivElement>(null)
  const closeHandler = useCallback(() => setOpen(false), [])
  useOnClickOutside(containerRef, closeHandler)

  const pendingTagsRef = useRef<string[] | null>(null)
  const tagSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSaveTags(tags: string[]) {
    pendingTagsRef.current = tags
    if (tagSaveTimerRef.current) clearTimeout(tagSaveTimerRef.current)
    tagSaveTimerRef.current = setTimeout(async () => {
      if (!resumeId || pendingTagsRef.current === null) return
      setSaveState('saving')
      try {
        const res = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: pendingTagsRef.current })
        })
        if (!res.ok) throw new Error()
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 2000)
      }
      pendingTagsRef.current = null
    }, 2000)
  }

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then(setAllTags)
      .catch(() => {})
  }, [])

  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase()
  )
  const showCreate = search.trim() !== '' && !exactMatch

  function toggleTag(tagName: string) {
    if (!resumeId) return
    const newTags = resumeTags.includes(tagName)
      ? resumeTags.filter((t) => t !== tagName)
      : [...resumeTags, tagName]
    setResumeTags(newTags)
    scheduleSaveTags(newTags)
  }

  function openCreate(name = '') {
    setEditingTag(undefined)
    setInitialName(name)
    setDialogOpen(true)
    setOpen(false)
  }

  function openEdit(tag: TagItem, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingTag(tag)
    setInitialName('')
    setDialogOpen(true)
    setOpen(false)
  }

  function handleTagCreated(tag: TagItem) {
    setAllTags((prev) => [...prev, tag])
    // Auto-attach the newly created tag
    if (resumeId) {
      const newTags = [...resumeTags, tag.name]
      setResumeTags(newTags)
      scheduleSaveTags(newTags)
    }
    setSearch('')
  }

  function handleTagUpdated(tag: TagItem) {
    const old = allTags.find((t) => t._id === tag._id)
    setAllTags((prev) => prev.map((t) => (t._id === tag._id ? tag : t)))
    if (old && old.name !== tag.name) {
      setResumeTags((prev) => prev.map((n) => (n === old.name ? tag.name : n)))
    }
  }

  function handleTagDeleted(tagId: string) {
    const deleted = allTags.find((t) => t._id === tagId)
    setAllTags((prev) => prev.filter((t) => t._id !== tagId))
    if (deleted) {
      setResumeTags((prev) => prev.filter((n) => n !== deleted.name))
    }
  }

  const attachedTags = allTags.filter((t) => resumeTags.includes(t.name))

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o)
          setSearch('')
        }}
        className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-slate-300"
      >
        <FiTag size={13} />
        {attachedTags.length > 0 ? (
          <div className="flex items-center gap-1">
            {attachedTags.slice(0, 3).map((t) => (
              <span
                key={t._id}
                style={{ backgroundColor: tagColorMap[t.color].hex }}
                className="h-2 w-2 rounded-full"
              />
            ))}
            {attachedTags.length > 3 && (
              <span className="text-xs">+{attachedTags.length - 3}</span>
            )}
          </div>
        ) : (
          <span className="text-xs">Tags</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-app-border bg-app-surface shadow-xl">
          <div className="border-b border-white/5 p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create…"
              className="w-full rounded-lg bg-app-surfaceElevated px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((tag) => {
              const attached = resumeTags.includes(tag.name)
              const { badgeBg, badgeText } = tagColorMap[tag.color]
              return (
                <div
                  key={tag._id}
                  onClick={() => toggleTag(tag.name)}
                  className="group mx-1 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border transition-colors ${attached ? 'border-white bg-white' : 'border-white/20'}`}
                    >
                      {attached && <FiCheck size={10} className="text-white" />}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: badgeBg, color: badgeText }}
                    >
                      {tag.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => openEdit(tag, e)}
                    className="rounded p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-slate-300"
                  >
                    <FiEdit2 size={12} />
                  </button>
                </div>
              )
            })}

            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-3 text-center text-xs text-slate-500">
                No tags yet
              </p>
            )}
          </div>

          <div className="border-t border-white/5 p-1">
            {showCreate ? (
              <button
                onClick={() => openCreate(search.trim())}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
              >
                <FiPlus size={14} />
                Create &ldquo;{search.trim()}&rdquo;
              </button>
            ) : (
              <button
                onClick={() => openCreate()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
              >
                <FiPlus size={14} />
                New tag
              </button>
            )}
          </div>
        </div>
      )}

      <TagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTag={editingTag}
        initialName={initialName}
        onCreated={handleTagCreated}
        onUpdated={handleTagUpdated}
        onDeleted={handleTagDeleted}
      />
    </div>
  )
}
