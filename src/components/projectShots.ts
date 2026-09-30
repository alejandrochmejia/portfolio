import type { L10n } from '../i18n.ts'

/** Screenshots of each system, shown in the project desktop's screens.exe window.
 *  Full-page captures (tall images): the window scrolls through them.
 *  Files live in /public/projects/<slug>/, keyed by `Project.title`. */
export type Shot = {
  src: string
  /** Intrinsic size (px) so the viewer can reserve space / compute the scroll. */
  w: number
  h: number
  device: 'desktop' | 'mobile'
  label: L10n
}

export const SHOTS: Record<string, Shot[]> = {}
