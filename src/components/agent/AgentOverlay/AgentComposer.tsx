'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import {
  Send,
  ChevronDown,
  Check,
  MessageCircle,
  ClipboardList,
  Wand,
  type LucideIcon
} from 'lucide-react'
import {
  agentModeAtom,
  agentIsStreamingAtom,
  AGENT_MODES,
  type AgentMode
} from '../../../atoms/agentAtom'

const MODE_ICONS: Record<AgentMode, LucideIcon> = {
  Chat: MessageCircle,
  Feedback: ClipboardList,
  Tailoring: Wand
}

const MODE_PLACEHOLDERS: Record<AgentMode, string> = {
  Chat: 'Ask anything about your resume…',
  Feedback: 'Ask for feedback on a section or the whole resume…',
  Tailoring: 'Describe the role — the agent will tailor your resume…'
}

interface AgentComposerProps {
  onSend: (text: string) => void
}

export function AgentComposer({ onSend }: AgentComposerProps) {
  const [mode, setMode] = useAtom(agentModeAtom)
  const isStreaming = useAtomValue(agentIsStreamingAtom)
  const [text, setText] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const ActiveIcon = MODE_ICONS[mode]
  const placeholder = MODE_PLACEHOLDERS[mode]

  const canSend = text.trim().length > 0 && !isStreaming

  // Auto-focus on mount (when overlay opens)
  useEffect(() => {
    const id = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Shift+Tab to cycle modes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        setMode((prev) => {
          const idx = AGENT_MODES.indexOf(prev)
          return AGENT_MODES[(idx + 1) % AGENT_MODES.length]
        })
      }
    },
    [setMode]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function submit() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function selectMode(m: AgentMode) {
    setMode(m)
    setDropdownOpen(false)
  }

  return (
    <div className="shrink-0 p-4">
      <div className="flex flex-col gap-5 rounded-2xl border border-app-border bg-app-surface px-4 pb-3 pt-4">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: '12rem' }}
        />

        <div className="flex items-center justify-between">
          {/* Mode dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surfaceElevated px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-app-borderStrong hover:bg-app-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ActiveIcon className="h-3.5 w-3.5" />
              {mode}
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-36 overflow-hidden rounded-xl border border-app-border bg-app-surfaceElevated shadow-xl">
                {AGENT_MODES.map((m) => {
                  const Icon = MODE_ICONS[m]
                  return (
                    <button
                      key={m}
                      onClick={() => selectMode(m)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-slate-100"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        {m}
                      </span>
                      {m === mode && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={submit}
            disabled={!canSend}
            className="flex items-center justify-center rounded-lg border border-white/90 bg-white p-2 text-app-background transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-600">
        Shift+Tab to cycle modes · Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
