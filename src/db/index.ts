import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'
import { env } from '@/env'

// Singleton cache to survive Next.js hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
}

export const connectDB = (): Promise<typeof mongoose> => {
  if (global._mongooseConn) return global._mongooseConn
  global._mongooseConn = mongoose.connect(env.MONGODB_URI)
  return global._mongooseConn
}

if (!global._mongoClient) {
  global._mongoClient = new MongoClient(env.MONGODB_URI)
}

export const client: MongoClient = global._mongoClient
export const db = client.db()

export default mongoose
