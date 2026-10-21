import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { client, db } from '@/db/index'
import { env } from '@/env'

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }
  }
})
