import { google } from '@ai-sdk/google'
import { generateText, Output, NoObjectGeneratedError } from 'ai'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../lib/auth'
import { TAILORING_SYSTEM_PROMPT } from '../../../../constants/prompts.constants'
import { aiDisabledResponse } from '@/lib/aiFeatures'
import { parseBody } from '@/lib/apiValidation'
import { AgentEditSchema } from '@/lib/apiSchemas'
import { editLimitMessage } from '@/lib/agentLimits'

// Ensure the env var is validated at startup via src/env.ts
import '../../../../env'

const FieldEditSchema = z.object({
  type: z.literal('set'),
  fieldPath: z
    .string()
    .describe(
      'Dot-notation path to the field. Examples: "basics.name", "work.0.position", "work.0.highlights.2", "skills.0.keywords", "projects.1.description"'
    ),
  newValue: z
    .union([z.string(), z.array(z.string())])
    .describe(
      'New value. Use a plain string for text fields. Use a string array ONLY for "skills.N.keywords" or "projects.N.keywords" paths. This key is ALWAYS "newValue" — never rename it to "keywords" or anything else.'
    ),
  reason: z
    .string()
    .describe(
      'One sentence explaining why this change helps the user land the target role.'
    )
})

const NewEntrySchema = z.object({
  type: z.literal('append'),
  arrayPath: z
    .enum(['work', 'education', 'projects', 'awards'])
    .describe(
      'Top-level array to append a new entry to. Do NOT use for skills — use appendSkill instead.'
    ),
  entry: z
    .object({
      // work
      company: z.string().optional(),
      position: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      location: z.string().optional(),
      highlights: z.array(z.string()).optional(),
      // education
      institution: z.string().optional(),
      area: z.string().optional(),
      studyType: z.string().optional(),
      score: z.string().optional(),
      // skills / projects (name is shared)
      name: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      // awards
      title: z.string().optional(),
      date: z.string().optional(),
      awarder: z.string().optional(),
      summary: z.string().optional()
    })
    .describe(
      'Full entry object to append. Include only fields relevant to the arrayPath type.'
    ),
  reason: z
    .string()
    .describe(
      'One sentence explaining why this new entry is relevant to the target role.'
    )
})

const AppendSkillSchema = z.object({
  type: z.literal('appendSkill'),
  name: z
    .string()
    .describe(
      'Display name for the new skill category. E.g. "Machine Learning", "Cloud & DevOps".'
    ),
  keywords: z
    .array(z.string())
    .describe('Keywords to list under this skill category.'),
  reason: z
    .string()
    .describe(
      'One sentence explaining why this new skill category strengthens the application.'
    )
})

const RemoveEntrySchema = z.object({
  type: z.literal('remove'),
  arrayPath: z
    .enum(['work', 'education', 'projects', 'awards', 'skills'])
    .describe('Top-level array from which to remove an existing entry.'),
  index: z
    .number()
    .int()
    .min(0)
    .describe('0-based index of the entry to remove from the array.'),
  reason: z
    .string()
    .describe(
      'One sentence explaining why removing this entry strengthens the application.'
    )
})

const AgentEditResponseSchema = z.object({
  summary: z
    .string()
    .describe(
      'A single sentence summarising all changes made. Example: "Tailored 7 fields to highlight React expertise for a Senior Frontend Engineer role at Stripe."'
    ),
  edits: z
    .array(
      z.discriminatedUnion('type', [
        FieldEditSchema,
        NewEntrySchema,
        AppendSkillSchema,
        RemoveEntrySchema
      ])
    )
    .describe('Ordered list of edit operations. Apply all of them.')
})

export async function POST(request: NextRequest) {
  const disabled = aiDisabledResponse()
  if (disabled) return disabled

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await parseBody(request, AgentEditSchema, 768_000)
  if (error) return error
  const { messages, resumeData } = data

  const model = google('gemini-3.1-flash-lite-preview')
  const system = `${TAILORING_SYSTEM_PROMPT}\n\n## User's current resume\n\n<resume>\n${JSON.stringify(resumeData, null, 2)}\n</resume>`

  try {
    const result = await generateText({
      model,
      maxOutputTokens: 8192,
      output: Output.object({ schema: AgentEditResponseSchema }),
      system,
      abortSignal: request.signal,
      messages: messages.map(({ role, content }) => ({ role, content }))
    })

    if (result.finishReason === 'length')
      return NextResponse.json({ error: editLimitMessage }, { status: 422 })
    const { output } = result
    console.log('[agent/edit] Generated edits:', {
      editCount: output.edits.length
    })
    return NextResponse.json(output)
  } catch (err) {
    if (
      NoObjectGeneratedError.isInstance(err) &&
      err.finishReason === 'length'
    ) {
      return NextResponse.json({ error: editLimitMessage }, { status: 422 })
    }
    if (NoObjectGeneratedError.isInstance(err)) {
      if (request.signal.aborted) return new Response(null, { status: 499 })
      console.warn(
        '[agent/edit] Schema validation failed, attempting repair...'
      )
      try {
        const repair = await generateText({
          model,
          maxOutputTokens: 8192,
          output: Output.object({ schema: AgentEditResponseSchema }),
          prompt: [
            'The following JSON was generated but failed schema validation:',
            err.text,
            'Validation errors:',
            JSON.stringify(err.cause, null, 2),
            'Fix the JSON so it matches the schema exactly. The most common mistake is using a field name other than "newValue" on "set" edits (e.g. writing "keywords" instead of "newValue"). Return only the corrected JSON.'
          ].join('\n\n'),
          abortSignal: request.signal
        })

        if (repair.finishReason === 'length')
          return NextResponse.json({ error: editLimitMessage }, { status: 422 })
        const { output: repaired } = repair
        console.log('[agent/edit] Repair successful:', {
          editCount: repaired.edits.length
        })
        return NextResponse.json(repaired)
      } catch (repairErr) {
        if (
          NoObjectGeneratedError.isInstance(repairErr) &&
          repairErr.finishReason === 'length'
        ) {
          return NextResponse.json({ error: editLimitMessage }, { status: 422 })
        }
        console.error('[agent/edit] Repair failed:', repairErr)
      }
    }

    if (request.signal.aborted) return new Response(null, { status: 499 })
    console.error('[agent/edit] generateText error:', err)
    return NextResponse.json(
      { error: 'Failed to generate edits' },
      { status: 500 }
    )
  }
}
