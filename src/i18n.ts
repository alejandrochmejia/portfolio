import { useSyncExternalStore } from 'react'
import type { L10n, Lang } from './l10n.ts'
import { LANG_PATH, META, langOfPath, pageUrl } from './seo/site.ts'

/** Bilingual ES/EN. A tiny module store (not a React context) so it also works
 *  inside the R3F <Canvas>, which renders in a separate reconciler.
 *
 *  Each language has its own URL (`/` Spanish, `/en/` English) and the URL is
 *  the source of truth, so crawlers index each version under its own address.
 *  On `/`, a person (not a crawler) may still get English from a legacy
 *  `?lang=en`, a saved choice or the browser language; the URL then moves to
 *  `/en/` so it always matches what's on screen. */
export type { L10n, Lang } from './l10n.ts'
export { LANGS } from './l10n.ts'

const KEY = 'lang'

/** Crawlers and audit tools: never switch them away from the URL's language. */
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|facebookexternalhit|embedly|preview/i

function initial(): Lang {
  if (typeof window === 'undefined') return 'es'
  if (langOfPath(location.pathname) === 'en') return 'en'
  const q = new URLSearchParams(location.search).get('lang')
  if (q === 'es' || q === 'en') return q
  if (BOT.test(navigator.userAgent)) return 'es'
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

/** Keep the address bar on the current language's path (drops a legacy `?lang=`). */
function syncUrl(lang: Lang) {
  if (typeof window === 'undefined') return
  const url = new URL(location.href)
  url.searchParams.delete('lang')
  url.pathname = LANG_PATH[lang]
  if (url.href !== location.href) history.replaceState(history.state, '', url)
}

const setAttr = (sel: string, attr: string, value: string) =>
  document.querySelector(sel)?.setAttribute(attr, value)

/** The static HTML ships each page's <head>; mirror it when switching in place. */
function applyDocument(lang: Lang) {
  if (typeof document === 'undefined') return
  const m = META[lang]
  document.documentElement.lang = lang
  document.title = m.title
  setAttr('meta[name="description"]', 'content', m.description)
  setAttr('link[rel="canonical"]', 'href', pageUrl(lang))
  setAttr('meta[property="og:url"]', 'content', pageUrl(lang))
  setAttr('meta[property="og:title"]', 'content', m.title)
  setAttr('meta[property="og:description"]', 'content', m.description)
  setAttr('meta[property="og:locale"]', 'content', m.locale)
  setAttr('meta[property="og:locale:alternate"]', 'content', META[lang === 'es' ? 'en' : 'es'].locale)
  setAttr('meta[property="og:image:alt"]', 'content', m.ogImageAlt)
  setAttr('meta[name="twitter:title"]', 'content', m.title)
  setAttr('meta[name="twitter:description"]', 'content', m.description)
}
applyDocument(current)
syncUrl(current)

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
  syncUrl(lang)
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

// Handy from the dev console: `setLang('en')`.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { setLang: typeof setLang }).setLang = setLang
}
