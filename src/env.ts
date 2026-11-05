import { z } from 'zod'

const envSchema = z
  .object({
    MONGODB_URI: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    AI_FEATURES_ENABLED: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (
      value.AI_FEATURES_ENABLED === 'true' &&
      !value.GOOGLE_GENERATIVE_AI_API_KEY
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_GENERATIVE_AI_API_KEY'],
        message: 'Required when AI_FEATURES_ENABLED=true'
      })
    }
  })

export function parseEnv(source: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(source)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    console.error('Invalid environment variables:')
    console.error(fieldErrors)
    throw new Error(
      `Invalid environment variables: ${Object.keys(fieldErrors).join(', ')}`
    )
  }

  return {
    ...parsed.data,
    aiFeaturesEnabled: parsed.data.AI_FEATURES_ENABLED === 'true'
  }
}

export const env = parseEnv(process.env)
