'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { Send, ChevronDown, Check, MessageCircle, ClipboardList, Wand, type LucideIcon } from 'lucide-react'
import { agentModeAtom, AGENT_MODES, type AgentMode } from '../../../atoms/agentAtom'

const MODE_ICONS: Record<AgentMode, LucideIcon> = {
  Chat: MessageCircle,
  Feedback: ClipboardList,
  Tailoring: Wand,
}

const MODE_PLACEHOLDERS: Record<AgentMode, string> = {
  Chat: 'Ask anything about your resume…',
  Feedback: 'Ask for feedback on a section or the whole resume…',
  Tailoring: 'Describe the role — the agent will tailor your resume…',
}

interface AgentComposerProps {
  onSend: (text: string) => void
}

export function AgentComposer({ onSend: _onSend }: AgentComposerProps) {
  const [mode, setMode] = useAtom(agentModeAtom)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const ActiveIcon = MODE_ICONS[mode]
  const placeholder = MODE_PLACEHOLDERS[mode]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
    [setMode],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function selectMode(m: AgentMode) {
    setMode(m)
    setDropdownOpen(false)
  }

  return (
    <div className="shrink-0 p-4">
      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-slate-900/70 px-4 pb-3 pt-4">
        <textarea
          rows={1}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          style={{ maxHeight: '12rem' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
        />

        <div className="flex items-center justify-between">
          {/* Mode dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <ActiveIcon className="h-3.5 w-3.5" />
              {mode}
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-xl">
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
                      {m === mode && <Check className="h-3.5 w-3.5 text-blue-400" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Send button */}
          <button className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-600">Shift+Tab to cycle modes</p>
    </div>
  )
}
