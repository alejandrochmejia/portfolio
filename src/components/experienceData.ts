import type { L10n, Lang } from '../i18n.ts'

export type ExperienceKind = 'work' | 'freelance' | 'education'

export type Experience = {
  org: string
  role: L10n
  kind: ExperienceKind
  /** Neutral month, `YYYY-MM` (formatted per language; also the `<time dateTime>`). */
  start: string
  /** `YYYY-MM`, or `null` while it's the current position. */
  end: string | null
  place: L10n
  /** Logo printed on the cover and the disc label (path under /public). */
  logo: string
  /** Put the logo on a cream plate (for transparent crests). */
  plate?: boolean
  /** Cover / disc tint: [main, secondary]. */
  tint: [string, string]
  /** One-line summary next to the case. */
  summary: L10n
  tags: string[]
  current?: boolean
}

export const KIND_LABEL: Record<ExperienceKind, L10n> = {
  work: { es: 'Trabajo', en: 'Work' },
  freelance: { es: 'Freelance', en: 'Freelance' },
  education: { es: 'Educación', en: 'Education' },
}

const MONTHS: Record<Lang, string[]> = {
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
const PRESENT: L10n = { es: 'Actualidad', en: 'Present' }

/** `'2025-12'` → `'Dic 2025'` / `'Dec 2025'`; `null` → `'Actualidad'` / `'Present'`. */
export function fmtMonth(ym: string | null, lang: Lang): string {
  if (!ym) return PRESENT[lang]
  const [y, m] = ym.split('-')
  return `${MONTHS[lang][Number(m) - 1]} ${y}`
}

/** `'Dic 2025 — Actualidad'`. */
export const fmtRange = (x: Experience, lang: Lang) => `${fmtMonth(x.start, lang)} — ${fmtMonth(x.end, lang)}`

/** Timeline shown as CD cases, most recent first (zig-zag: left, right, left…).
 *  Roles, dates and skills from LinkedIn; the freelance entry isn't on LinkedIn. */
export const EXPERIENCE: Experience[] = [
  {
    org: 'Botinfy',
    role: { es: 'Gerente de Desarrollo', en: 'Development Manager' },
    kind: 'work',
    start: '2025-12',
    end: null,
    place: { es: 'Venezuela · Presencial', en: 'Venezuela · On-site' },
    logo: '/icons/botinfy.png',
    tint: ['#4b4bff', '#ff8fd0'],
    summary: {
      es: 'Liderando el desarrollo de producto, bases de datos y DevOps.',
      en: 'Leading product development, databases and DevOps.',
    },
    tags: ['Databases', 'DevOps', 'React'],
    current: true,
  },
  {
    org: 'Botinfy',
    role: { es: 'Desarrollador de Agentes de IA y Soporte', en: 'AI Agent Developer & Support' },
    kind: 'work',
    start: '2025-06',
    end: '2026-01',
    place: { es: 'Valencia, Carabobo · Híbrido', en: 'Valencia, Carabobo · Hybrid' },
    logo: '/icons/botinfy.png',
    tint: ['#8bb8ff', '#4b4bff'],
    summary: {
      es: 'Construí agentes de IA y automatizaciones con n8n para clientes.',
      en: 'Built AI agents and n8n automations for clients.',
    },
    tags: ['AI', 'n8n', 'Automation'],
  },
  {
    org: 'Freelance',
    role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
    kind: 'freelance',
    start: '2024-12',
    end: '2025-06',
    place: { es: 'Remoto', en: 'Remote' },
    logo: '/xp/freelance.svg',
    tint: ['#ff8fd0', '#8b6bff'],
    summary: {
      es: 'Aplicaciones web para clientes, del diseño al despliegue.',
      en: 'Web apps for clients, from design to deploy.',
    },
    tags: ['React', 'Tailwind', 'Supabase'],
  },
  {
    org: 'UJAP',
    role: { es: 'Ingeniería en Computación', en: 'Computer Engineering' },
    kind: 'education',
    start: '2022-09',
    end: '2026-04',
    place: {
      es: 'Universidad José Antonio Páez · Carabobo, VE',
      en: 'Universidad José Antonio Páez · Carabobo, VE',
    },
    logo: '/xp/ujap.png',
    plate: true,
    tint: ['#d4262e', '#c9a45c'],
    summary: {
      es: 'Carrera de Ingeniería en Computación.',
      en: 'Engineering degree in Computer Engineering.',
    },
    tags: ['Java', 'Python', 'JavaScript'],
  },
]
