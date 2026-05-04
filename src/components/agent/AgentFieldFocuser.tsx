'use client'

import { useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import {
  agentFocusedEditIdAtom,
  agentPendingEditsAtom
} from '../../atoms/agentEdits'
import { activeSectionSetterAtom } from '../../atoms/activeSection'

function fieldPathToSection(fieldPath: string): string {
  const prefix = fieldPath.split('.')[0]
  if (prefix === 'headings') return fieldPath.split('.')[1] ?? 'basics'

  switch (prefix) {
    case 'basics':
      return 'basics'
    case 'work':
      return 'work'
    case 'education':
      return 'education'
    case 'skills':
      return 'skills'
    case 'projects':
      return 'projects'
    case 'awards':
      return 'awards'
    default:
      return 'basics'
  }
}

const PADDING_TOP = 80

// ---------------------------------------------------------------------------
// MutationObserver-based element detection.
// Fires `onFound` the frame after the element appears in the container's DOM.
// ---------------------------------------------------------------------------
function waitForElement(
  container: HTMLElement,
  selector: string,
  onFound: (el: Element) => void,
  maxWait = 500
): () => void {
  // `cancelled` is set only by external cleanup (React effect teardown).
  // Separating it from `stopWatching` fixes the bug where finish() → stopWatching()
  // would set a shared flag, causing the rAF callback to see !cancelled === false
  // and never call onFound.
  let cancelled = false
  let cleanupRaf: (() => void) | null = null

  function stopWatching() {
    observer.disconnect()
    clearTimeout(timeout)
  }

  function finish(el: Element) {
    stopWatching()
    const id = requestAnimationFrame(() => {
      if (!cancelled) onFound(el)
    })
    cleanupRaf = () => cancelAnimationFrame(id)
  }

  const observer = new MutationObserver(() => {
    if (cancelled) return
    const el = container.querySelector(selector)
    if (el) finish(el)
  })

  const timeout = window.setTimeout(stopWatching, maxWait)

  const immediate = container.querySelector(selector)
  if (immediate) {
    finish(immediate)
    return () => {
      cancelled = true
      cleanupRaf?.()
    }
  }

  observer.observe(container, { childList: true, subtree: true })

  return () => {
    cancelled = true
    stopWatching()
    cleanupRaf?.()
  }
}

// ---------------------------------------------------------------------------
// JS-driven smooth scroll via direct scrollTop assignment.
// Adapted from VS Code's SmoothScrollingOperation (scrollable.ts).
// Bypasses scrollIntoView / scrollTo which Chrome silently drops inside
// nested overflow-hidden > overflow-auto containers.
// ---------------------------------------------------------------------------
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function smoothScrollTo(
  el: HTMLElement,
  target: number,
  cancelRef: React.MutableRefObject<(() => void) | null>
) {
  cancelRef.current?.()
  cancelRef.current = null

  const clamped = Math.max(
    0,
    Math.min(target, el.scrollHeight - el.clientHeight)
  )
  const from = el.scrollTop
  const delta = clamped - from
  if (Math.abs(delta) < 1) return

  const duration = Math.min(300, Math.max(150, Math.abs(delta) * 0.3))
  const start = Date.now() - 10

  function tick() {
    const progress = Math.min((Date.now() - start) / duration, 1)
    el.scrollTop = from + delta * easeOutCubic(progress)
    if (progress < 1) {
      const id = requestAnimationFrame(tick)
      cancelRef.current = () => cancelAnimationFrame(id)
    } else {
      cancelRef.current = null
    }
  }

  const id = requestAnimationFrame(tick)
  cancelRef.current = () => cancelAnimationFrame(id)
}

/**
 * Side-effect-only component rendered inside the Form.
 * Watches agentFocusedEditIdAtom and navigates the active section + scrolls
 * to the relevant field whenever the focused edit changes.
 */
export function AgentFieldFocuser() {
  const focusedId = useAtomValue(agentFocusedEditIdAtom)
  const pendingEdits = useAtomValue(agentPendingEditsAtom)
  const setActiveSection = useAtomValue(activeSectionSetterAtom)
  const prevSectionRef = useRef<string | null>(null)
  const scrollCancelRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!focusedId || !setActiveSection) return

    const edit = pendingEdits.find((e) => e.id === focusedId)
    if (!edit) return

    const section =
      edit.type === 'set' ? fieldPathToSection(edit.fieldPath) : edit.arrayPath
    const sectionChanged = prevSectionRef.current !== section
    prevSectionRef.current = section
    setActiveSection(section)

    const forms = document.querySelectorAll('[data-resume-form]')
    const formEl =
      (Array.from(forms).find(
        (f) => (f as HTMLElement).clientHeight > 0
      ) as HTMLElement) ?? null

    scrollCancelRef.current?.()
    scrollCancelRef.current = null

    if (sectionChanged && formEl) formEl.scrollTop = 0

    const fieldPath = edit.type === 'set' ? edit.fieldPath : null
    const selector = fieldPath
      ? `[data-field-path="${fieldPath}"]`
      : edit.type === 'append' || edit.type === 'remove'
        ? `[data-array-path="${edit.arrayPath}"][data-array-index="${edit.entryIndex}"]`
        : null
    if (!selector || !formEl) return

    return waitForElement(formEl, selector, (el) => {
      // Desktop: form has a constrained height and is the scroll container.
      if (formEl.scrollHeight > formEl.clientHeight) {
        // Desktop: form is the scroll container. Always scroll to target — smoothScrollTo
        // is a no-op if the delta is < 1 px, so no extra guard needed.
        const formRect = formEl.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const target =
          formEl.scrollTop + (elRect.top - formRect.top) - PADDING_TOP
        smoothScrollTo(formEl, target, scrollCancelRef)
      } else {
        // Mobile: form expands to content, window is the scroll container.
        // scrollIntoView is safe here — no overflow-hidden ancestors in mobile layout.
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }, [focusedId]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
