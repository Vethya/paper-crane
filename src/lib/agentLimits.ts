export const AGENT_LIMITS = {
  resume: 64_000,
  message: 32_000,
  context: 128_000
}
// Count Unicode code points, including emoji, identically in the browser and server.
export const characterCount = (text: string) => Array.from(text).length
export function resumeSize(resume: object) {
  try {
    return characterCount(JSON.stringify(resume))
  } catch {
    return Infinity
  }
}
type Message = { role: 'user' | 'assistant'; content: string; error?: boolean }
export const contextSize = (resume: object, messages: Message[]) =>
  resumeSize(resume) +
  messages.reduce((n, m) => n + characterCount(m.content), 0)
export const editLimitMessage =
  'Editing reached its length limit. No changes applied. Try one section at a time.'

export function prepareAgentMessages(resume: object, history: Message[]) {
  const turns: Message[][] = []
  const sizes: number[] = []
  let total = resumeSize(resume)
  let lastOversized = -1
  for (const message of history) {
    if (message.error || !message.content) continue
    if (message.role === 'user') {
      turns.push([])
      sizes.push(0)
    }
    if (!turns.length) continue
    const count = characterCount(message.content)
    total += count
    sizes[sizes.length - 1] += count
    if (count > AGENT_LIMITS.message) lastOversized = turns.length - 1
    turns.at(-1)!.push({ role: message.role, content: message.content })
  }
  const context = total
  let start = 0
  while (
    start < turns.length - 1 &&
    (total > AGENT_LIMITS.context || start <= lastOversized)
  )
    total -= sizes[start++]
  return { messages: turns.slice(start).flat(), trimmed: start > 0, context }
}

export function agentWarnings(
  resume: object,
  history: Message[],
  draft: string
) {
  const current = characterCount(draft.trim())
  const size = resumeSize(resume)
  const prepared = prepareAgentMessages(resume, [
    ...history,
    { role: 'user', content: draft.trim() }
  ])
  const context = prepared.context
  const warnings: string[] = []
  const format = (n: number) => n.toLocaleString('en-US')
  const blocked = size > AGENT_LIMITS.resume || current > AGENT_LIMITS.message
  for (const [label, count, limit] of [
    ['Resume', size, AGENT_LIMITS.resume],
    ['Message', current, AGENT_LIMITS.message]
  ] as const) {
    if (count >= limit * 0.8)
      warnings.push(
        (label === 'Resume'
          ? 'Your current resume is included in this chat for context. ' +
            (count > limit
              ? 'It exceeds the size limit: '
              : "It's close to the size limit: ")
          : `${label}: `) +
          `${format(count)} / ${format(limit)} characters. ` +
          (count > limit
            ? (label === 'Resume'
                ? 'Return to the resume editor and shorten some descriptions. '
                : 'Shorten your question or pasted job description. ') +
              `Remove ${format(count - limit)} characters to send.`
            : `${format(limit - count)} characters remaining.`)
      )
  }
  if (prepared.trimmed)
    warnings.push(
      'Earlier messages are no longer sent to the AI. Your saved chat is intact.'
    )
  else if (context >= AGENT_LIMITS.context * 0.8)
    warnings.push(
      'This conversation is getting long. Older messages may soon be left out of what the AI remembers.'
    )
  return { warnings, blocked }
}

// A reply still marked as generating after this long has failed on the server.
export const REPLY_TIMEOUT_MS = 90_000
export const isGenerating = (generatingSince?: string | Date | null) =>
  !!generatingSince &&
  Date.now() - new Date(generatingSince).getTime() < REPLY_TIMEOUT_MS
export const failedReplyMessage =
  'This reply could not be generated. Please try again.'
