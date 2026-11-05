'use client'

import { createContext, useContext, type ReactNode } from 'react'

const AiFeaturesContext = createContext(false)

export function AiFeaturesProvider({
  enabled,
  children
}: {
  enabled: boolean
  children: ReactNode
}) {
  return (
    <AiFeaturesContext.Provider value={enabled}>
      {children}
    </AiFeaturesContext.Provider>
  )
}

export function useAiFeaturesEnabled() {
  return useContext(AiFeaturesContext)
}
