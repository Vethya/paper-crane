import { connectDB } from '@/db'
import { AgentSession } from '@/db/models/agentSession'

export type ReplyTarget = { userId: string; sessionId: string; replyId: string }

/** Marks the session as generating. Returns false if the user doesn't own it. */
export async function startReply({ userId, sessionId }: ReplyTarget) {
  await connectDB()
  const result = await AgentSession.updateOne(
    { _id: sessionId, userId },
    { $set: { generatingSince: new Date() } }
  )
  return result.matchedCount > 0
}

/** Saves the finished reply, whether or not the browser is still connected. */
export async function finishReply(
  { userId, sessionId, replyId }: ReplyTarget,
  content: string,
  error = false
) {
  try {
    await connectDB()
    await AgentSession.updateOne(
      { _id: sessionId, userId },
      {
        $push: {
          messages: {
            id: replyId,
            role: 'assistant',
            content,
            ...(error && { error })
          }
        },
        $unset: { generatingSince: 1 }
      }
    )
  } catch (err) {
    console.error('[agent] Reply save error:', err)
  }
}
