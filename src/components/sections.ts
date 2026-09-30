import type { L10n } from '../i18n.ts'

/** Site sections as the menu lists them. Several live inside pinned scroll
 *  choreographies (hero/about/projects share `.world`, Tech Stack has its CRT
 *  intro), so a plain `#id` jump would land mid-animation: each one resolves the
 *  scroll offset where it's fully on screen. `p` values follow choreography.ts. */
export type Section = { id: string; label: L10n; top: () => number }

const el = (sel: string) => document.querySelector<HTMLElement>(sel)

/** Offset inside a pinned section: `f` 0..1 along its scrollable length. */
function pinned(sel: string, f: number) {
  const s = el(sel)
  if (!s) return 0
  const pin = s.firstElementChild as HTMLElement | null
  const len = s.offsetHeight - (pin?.offsetHeight ?? window.innerHeight)
  return s.offsetTop + Math.max(0, len) * f
}

export const SECTIONS: Section[] = [
  { id: 'home', label: { es: 'Inicio', en: 'Home' }, top: () => 0 },
  // ABOUT_IN ends at 0.22, ABOUT_OUT starts at 0.34.
  { id: 'about-me', label: { es: 'Sobre mí', en: 'About me' }, top: () => pinned('.world', 0.28) },
  // FIELD_IN ends at 0.57, FIELD_OUT starts at 0.86.
  { id: 'projects', label: { es: 'Proyectos', en: 'Projects' }, top: () => pinned('.world', 0.7) },
  // Screen fully "on" mid-way through the CRT pin.
  { id: 'tech-stack', label: { es: 'Tecnologías', en: 'Tech stack' }, top: () => pinned('.tstack', 0.45) },
  { id: 'experience', label: { es: 'Experiencia', en: 'Experience' }, top: () => el('.xp')?.offsetTop ?? 0 },
  { id: 'contact', label: { es: 'Contacto', en: 'Contact' }, top: () => el('.contact')?.offsetTop ?? 0 },
]

/** Section currently on screen. Pinned phases count from where they begin;
 *  the free-flowing ones once they fill half the viewport. */
export function currentSection(): string {
  const y = window.scrollY
  const half = window.innerHeight * 0.5
  const starts: Record<string, number> = {
    home: 0,
    'about-me': pinned('.world', 0.13),
    projects: pinned('.world', 0.45),
    'tech-stack': (el('.tstack')?.offsetTop ?? Infinity) - half,
    experience: (el('.xp')?.offsetTop ?? Infinity) - half,
    contact: (el('.contact')?.offsetTop ?? Infinity) - half,
  }
  let id = 'home'
  for (const s of SECTIONS) if (y >= starts[s.id]) id = s.id
  return id
}

/** Jump (instantly — the menu's glass covers it) and keep the URL shareable. */
export function goToSection(id: string) {
  const s = SECTIONS.find((x) => x.id === id)
  if (!s) return
  window.scrollTo({ top: Math.round(s.top()), behavior: 'instant' })
  history.replaceState(null, '', id === 'home' ? location.pathname + location.search : `#${id}`)
}
