import { connection } from 'next/server'
import type { ReactNode } from 'react'
import { AiFeaturesProvider } from '@/components/agent/AiFeaturesProvider'
import { isAiEnabled } from '@/lib/aiFeatures'

export default async function GeneratorLayout({
  children
}: {
  children: ReactNode
}) {
  // Read the flag per request so it isn't frozen into a prerendered page.
  await connection()

  return (
    <AiFeaturesProvider enabled={isAiEnabled()}>{children}</AiFeaturesProvider>
  )
}
