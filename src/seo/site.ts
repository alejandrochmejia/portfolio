import type { Lang } from '../l10n.ts'

/** Site identity and per-language meta. DOM-free: shared by the runtime
 *  (i18n.ts keeps <head> in sync when the language changes) and the build
 *  (seo/render.ts writes it into the static HTML). */

/** Production origin, no trailing slash. */
export const SITE_URL = 'https://alejandrochmejia.com'

/** Each language lives at its own URL; `/` is Spanish, `/en/` English. */
export const LANG_PATH: Record<Lang, string> = { es: '/', en: '/en/' }
export const pageUrl = (lang: Lang) => SITE_URL + LANG_PATH[lang]

/** Language of a pathname (anything under /en is English). */
export const langOfPath = (path: string): Lang => (/^\/en(\/|$)/.test(path) ? 'en' : 'es')

export const PERSON = {
  name: 'Alejandro Chávez',
  givenName: 'Alejandro',
  familyName: 'Chávez',
  email: 'alejandrochmejia@gmail.com',
  city: 'Valencia',
  region: 'Carabobo',
  country: 'VE',
  birthPlace: 'Caracas, Venezuela',
}

export const PROFILES = {
  github: 'https://github.com/alejandrochmejia',
  linkedin: 'https://www.linkedin.com/in/alejandrochmejia',
  instagram: 'https://www.instagram.com/alejandrochmejia',
}

/** Social preview image (1200×630, under /public). */
export const OG_IMAGE = { path: '/og.png', width: 1200, height: 630 }

export type Meta = {
  title: string
  description: string
  jobTitle: string
  /** Open Graph locale. */
  locale: string
  ogImageAlt: string
}

export const META: Record<Lang, Meta> = {
  es: {
    title: 'Alejandro Chávez — Desarrollador Full-Stack e Ingeniero de IA',
    description:
      'Portfolio de Alejandro Chávez, desarrollador full-stack e ingeniero de IA en Venezuela. ' +
      'SaaS, agentes de IA y automatizaciones con React, Next.js, NestJS, Supabase y n8n.',
    jobTitle: 'Desarrollador Full-Stack e Ingeniero de IA',
    locale: 'es_VE',
    ogImageAlt: 'Alejandro Chávez — Desarrollador Full-Stack e Ingeniero de IA',
  },
  en: {
    title: 'Alejandro Chávez — Full-Stack Developer & AI Engineer',
    description:
      'Portfolio of Alejandro Chávez, full-stack developer and AI engineer from Venezuela. ' +
      'SaaS products, AI agents and automations with React, Next.js, NestJS, Supabase and n8n.',
    jobTitle: 'Full-Stack Developer & AI Engineer',
    locale: 'en_US',
    ogImageAlt: 'Alejandro Chávez — Full-Stack Developer & AI Engineer',
  },
}
