'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { formDataAtom } from '../../../atoms/formData'
import { agentMessagesAtom } from '../../../atoms/agentAtom'
import { agentWarnings } from '../../../lib/agentLimits'
import {
  ChevronDown,
  Check,
  MessageCircle,
  ClipboardList,
  Wand,
  type LucideIcon,
  ArrowUp
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

  const resume = useAtomValue(formDataAtom)
  const messages = useAtomValue(agentMessagesAtom)
  const { warnings, blocked } = agentWarnings(resume ?? {}, messages, text)
  const canSend = text.trim().length > 0 && !isStreaming && !blocked

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
      {warnings.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          id="agent-limits"
          className={`mb-3 space-y-1 text-xs ${blocked ? 'text-red-400' : 'text-amber-300'}`}
        >
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-app-card border border-app-border bg-app-surface px-4 pb-3 pt-3.5 transition-colors focus-within:border-app-borderStrong">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          aria-label="Message"
          aria-describedby={warnings.length ? 'agent-limits' : undefined}
          aria-invalid={blocked}
          placeholder={placeholder}
          disabled={isStreaming}
          className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: '12rem' }}
        />

        <div className="flex items-center justify-between">
          {/* Mode dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="-ml-2 flex items-center gap-1.5 rounded-app-button px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-app-control hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ActiveIcon className="h-3.5 w-3.5" />
              {mode}
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-36 overflow-hidden rounded-app-card border border-app-controlBorder bg-app-surfaceElevated shadow-xl">
                {AGENT_MODES.map((m) => {
                  const Icon = MODE_ICONS[m]
                  return (
                    <button
                      key={m}
                      onClick={() => selectMode(m)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium text-slate-300 transition hover:bg-app-control hover:text-white"
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
            aria-label="Send message"
            onClick={submit}
            disabled={!canSend}
            className="flex h-8 w-8 items-center justify-center rounded-app-button bg-white text-app-background transition hover:bg-app-primaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-app-control disabled:text-slate-500"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        Shift+Tab to cycle modes · Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
