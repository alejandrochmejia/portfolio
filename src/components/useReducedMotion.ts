import { useSyncExternalStore } from 'react'

/** `prefers-reduced-motion: reduce`, live (follows OS changes). A module-level
 *  matchMedia store, so it also works inside the R3F reconciler. */
const RM_QUERY = '(prefers-reduced-motion: reduce)'
const rmList = typeof matchMedia !== 'undefined' ? matchMedia(RM_QUERY) : null
const rmSubscribe = (cb: () => void) => {
  rmList?.addEventListener('change', cb)
  return () => rmList?.removeEventListener('change', cb)
}
const rmGet = () => rmList?.matches ?? false
export function useReducedMotion(): boolean {
  return useSyncExternalStore(rmSubscribe, rmGet, rmGet)
}
