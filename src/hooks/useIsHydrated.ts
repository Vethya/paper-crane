import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// false during SSR and hydration, true once React has attached event handlers
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
