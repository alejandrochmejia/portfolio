/** Language types, DOM-free so the build (vite.config.ts → seo) can import the
 *  data files too. Runtime state lives in i18n.ts, which re-exports these. */
export type Lang = 'es' | 'en'
export const LANGS: Lang[] = ['es', 'en']

/** A string in both languages. Data files use it for any visible copy. */
export type L10n = { es: string; en: string }
