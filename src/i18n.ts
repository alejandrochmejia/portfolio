import { useSyncExternalStore } from 'react'

/** Bilingual ES/EN. A tiny module store (not a React context) so it also works
 *  inside the R3F <Canvas>, which renders in a separate reconciler.
 *
 *  Initial language: `?lang=es|en` → saved choice → browser language → 'es'.
 *  The language switch will live in the menu (`setLang`). */
export type Lang = 'es' | 'en'
export const LANGS: Lang[] = ['es', 'en']

/** A string in both languages. Data files use it for any visible copy. */
export type L10n = { es: string; en: string }

const KEY = 'lang'

function initial(): Lang {
  if (typeof window === 'undefined') return 'es'
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'es' || q === 'en') return q
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* storage blocked */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

let current: Lang = initial()
const listeners = new Set<() => void>()

const META: Record<Lang, { title: string; description: string }> = {
  es: {
    title: 'Alejandro Chávez — Desarrollador Full-Stack e Ingeniero de IA',
    description: 'Portfolio de Alejandro Chávez, desarrollador full-stack e ingeniero de IA.',
  },
  en: {
    title: 'Alejandro Chávez — Full-Stack Developer & AI Engineer',
    description: 'Portfolio of Alejandro Chávez, full-stack developer and AI engineer.',
  },
}

function applyDocument(lang: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.title = META[lang].title
  document.querySelector('meta[name="description"]')?.setAttribute('content', META[lang].description)
}
applyDocument(current)

export function getLang(): Lang {
  return current
}

export function setLang(lang: Lang) {
  if (lang === current) return
  current = lang
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* storage blocked */
  }
  applyDocument(lang)
  // A `?lang=` in the URL wins on load, so keep it in sync with the choice.
  const url = new URL(window.location.href)
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', lang)
    history.replaceState(history.state, '', url)
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Current language; re-renders on change. Works in DOM and R3F components. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang)
}

/** Pick the current language's string. */
export const tr = (s: L10n, lang: Lang) => s[lang]

/** Per-component copy: `const t = useCopy(COPY)` with `COPY = { es: {...}, en: {...} }`. */
export function useCopy<T>(copy: Record<Lang, T>): T {
  return copy[useLang()]
}

// Until the menu's language switch exists: `setLang('en')` from the dev console.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { setLang: typeof setLang }).setLang = setLang
}
