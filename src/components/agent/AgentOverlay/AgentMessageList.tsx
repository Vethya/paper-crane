'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { AgentMessage } from '../../../atoms/agentAtom'

interface AgentMessageListProps {
  messages: AgentMessage[]
  isStreaming: boolean
}

export function AgentMessageList({ messages, isStreaming }: AgentMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const visible = messages.filter((m) => !m.hidden)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-center text-sm text-slate-500">Ask anything about your resume</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="flex flex-col gap-4">
        {visible.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-sm bg-blue-600 text-white whitespace-pre-wrap'
                  : 'rounded-bl-sm bg-slate-800/80 text-slate-200'
              }`}
            >
              {msg.role === 'assistant' ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="mb-2 text-base font-bold text-white">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-1.5 text-sm font-bold text-white">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold text-white">{children}</h3>,
                      code: ({ children }) => <code className="rounded bg-slate-700 px-1 font-mono text-xs">{children}</code>,
                      pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded bg-slate-700 p-2 font-mono text-xs">{children}</pre>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {isStreaming && msg.content === '' && (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce [animation-delay:0ms]">·</span>
                      <span className="animate-bounce [animation-delay:150ms]">·</span>
                      <span className="animate-bounce [animation-delay:300ms]">·</span>
                    </span>
                  )}
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
