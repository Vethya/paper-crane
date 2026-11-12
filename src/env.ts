import { z } from 'zod'
import { isAiEnabled } from './lib/aiFeatures'

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  AI_FEATURES_ENABLED: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().trim().optional()
})

export function parseEnv(source: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(source)
  const fieldErrors: Record<string, string[] | undefined> = parsed.success
    ? {}
    : parsed.error.flatten().fieldErrors

  // Checked outside the schema so it is reported with the other errors.
  if (isAiEnabled(source) && !source.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    fieldErrors.GOOGLE_GENERATIVE_AI_API_KEY = [
      'Required when AI_FEATURES_ENABLED=true'
    ]
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    console.error('Invalid environment variables:')
    console.error(fieldErrors)
    throw new Error(
      `Invalid environment variables: ${Object.keys(fieldErrors).join(', ')}`
    )
  }

  return parsed.data
}

export const env = parseEnv(process.env)
