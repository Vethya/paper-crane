'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAtom } from 'jotai'
import { FiCheck, FiEdit2, FiPlus, FiTag } from 'react-icons/fi'
import { resumeTagsAtom } from '@/atoms/resumeTags'
import { TagDialog, type TagItem } from './TagDialog'
import { tagColorMap } from '@/lib/tagColors'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { patchResume, useResumeSaver } from '@/hooks/useResumeSaver'

const saveTags = (resumeId: string, snapshot: string) =>
  patchResume(resumeId, `{"tags":${snapshot}}`)

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

  const triggerRef = useRef<HTMLButtonElement>(null)
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const dropdownId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const closeHandler = useCallback(() => setOpen(false), [])
  useOnClickOutside(containerRef, closeHandler)

  // Tags change only through this picker, so every update is a real change.
  // The empty baseline never matches a serialized tag list.
  const saverRef = useResumeSaver(resumeId, saveTags, '')

  function scheduleSaveTags(tags: string[]) {
    saverRef.current?.update(JSON.stringify(tags))
  }

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      // Signed-out requests return an error object, not a list.
      .then((tags) => setAllTags(Array.isArray(tags) ? tags : []))
      .catch(() => {})
  }, [])

  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase()
  )
  const showCreate = search.trim() !== '' && !exactMatch

  const activeIndex = Math.max(
    0,
    filtered.findIndex((tag) => tag._id === activeTagId)
  )

  function focusRow(index: number) {
    if (!filtered[index]) return
    setActiveTagId(filtered[index]._id)
    rowRefs.current[index]?.focus()
  }

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

  function openEdit(tag: TagItem) {
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
    <div ref={containerRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dropdownId : undefined}
        aria-label={
          attachedTags.length
            ? `Tags: ${attachedTags.map((tag) => tag.name).join(', ')}`
            : 'Tags'
        }
        onClick={() => {
          setOpen((o) => !o)
          setSearch('')
          setActiveTagId(null)
        }}
        className="flex max-w-[min(12rem,24vw)] sm:max-w-[12rem] items-center gap-1.5 rounded-app-button border border-app-controlBorder bg-app-control px-3 py-1.5 text-sm text-white transition-colors hover:bg-app-controlHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <FiTag size={13} className="shrink-0" aria-hidden="true" />
        {attachedTags.length > 0 ? (
          <span
            className="flex min-w-0 items-center gap-1 text-xs"
            aria-hidden="true"
          >
            {attachedTags.slice(0, 2).map((tag) => (
              <span key={tag._id} className="min-w-0 truncate" title={tag.name}>
                {tag.name}
              </span>
            ))}
            {attachedTags.length > 2 && (
              <span className="shrink-0">+{attachedTags.length - 2}</span>
            )}
          </span>
        ) : (
          <span className="text-xs">Tags</span>
        )}
      </button>

      {open && (
        <div
          id={dropdownId}
          role="dialog"
          aria-label="Resume tags"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
              triggerRef.current?.focus()
            }
          }}
          className="absolute right-0 top-10 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-app-card border border-app-controlBorder bg-app-surface shadow-xl"
        >
          <div className="border-b border-white/5 p-2">
            <input
              autoFocus
              value={search}
              aria-label="Search or create tags"
              onChange={(e) => {
                setSearch(e.target.value)
                setActiveTagId(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' && filtered.length) {
                  event.preventDefault()
                  focusRow(0)
                }
              }}
              placeholder="Search or create…"
              className="w-full rounded-app-button border border-app-controlBorder bg-app-control px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-white"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((tag, index) => {
              const attached = resumeTags.includes(tag.name)
              const { badgeBg, badgeText } = tagColorMap[tag.color]
              return (
                <div
                  key={tag._id}
                  className="group mx-1 flex items-center rounded-app-button hover:bg-app-control"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={attached}
                    ref={(node) => {
                      rowRefs.current[index] = node
                    }}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onFocus={() => setActiveTagId(tag._id)}
                    onClick={() => toggleTag(tag.name)}
                    onKeyDown={(event) => {
                      const target =
                        event.key === 'ArrowDown'
                          ? (index + 1) % filtered.length
                          : event.key === 'ArrowUp'
                            ? (index - 1 + filtered.length) % filtered.length
                            : event.key === 'Home'
                              ? 0
                              : event.key === 'End'
                                ? filtered.length - 1
                                : null
                      if (target !== null) {
                        event.preventDefault()
                        focusRow(target)
                      }
                    }}
                    className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-app-button px-2 py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-app-small border transition-colors ${attached ? 'border-white bg-white' : 'border-white/20'}`}
                    >
                      {attached && (
                        <FiCheck size={10} className="text-app-background" />
                      )}
                    </span>
                    <span
                      className="truncate rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: badgeBg, color: badgeText }}
                    >
                      {tag.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit tag ${tag.name}`}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onClick={() => openEdit(tag)}
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-app-button text-slate-400 transition hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white [@media(hover:hover)_and_(pointer:fine)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                  >
                    <FiEdit2 size={12} />
                  </button>
                </div>
              )
            })}

            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-3 text-center text-xs text-slate-400">
                No tags yet
              </p>
            )}
          </div>

          <div className="border-t border-white/5 p-1">
            {showCreate ? (
              <button
                onClick={() => openCreate(search.trim())}
                className="flex min-h-[44px] w-full items-center gap-2 break-all rounded-app-button px-3 py-2 text-left text-sm text-white transition hover:bg-app-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <FiPlus size={14} className="shrink-0" aria-hidden="true" />
                Create &ldquo;{search.trim()}&rdquo;
              </button>
            ) : (
              <button
                onClick={() => openCreate()}
                className="flex min-h-[44px] w-full items-center gap-2 break-all rounded-app-button px-3 py-2 text-left text-sm text-white transition hover:bg-app-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <FiPlus size={14} className="shrink-0" aria-hidden="true" />
                New tag
              </button>
            )}
          </div>
        </div>
      )}

      <TagDialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen)
          if (!isOpen) triggerRef.current?.focus()
        }}
        editTag={editingTag}
        initialName={initialName}
        onCreated={handleTagCreated}
        onUpdated={handleTagUpdated}
        onDeleted={handleTagDeleted}
      />
    </div>
  )
}
