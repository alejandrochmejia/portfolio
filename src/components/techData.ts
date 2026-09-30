import type { L10n } from '../l10n.ts'

/** Technologies shown as blocks in the Tech Stack mini-game. Order = grid order
 *  (row by row). `color` tints the block and its explosion; `kind` is the small
 *  label shown next to the name when the block is destroyed; `icon` is the logo
 *  drawn on the block. */
export type Tech = {
  name: string
  kind: 'Frontend' | 'Backend' | 'Mobile' | 'Data' | 'AI' | 'Automation' | 'DevOps' | 'Language'
  color: string
  /** Monochrome Simple Icons SVG in /public/tech (recoloured with `color` at load). */
  icon: string
}

export const TECH: Tech[] = [
  { name: 'Next.js', kind: 'Frontend', color: '#f6ecd4', icon: '/tech/nextdotjs.svg' },
  { name: 'React', kind: 'Frontend', color: '#7fe3ff', icon: '/tech/react.svg' },
  { name: 'Vue.js', kind: 'Frontend', color: '#9dffb5', icon: '/tech/vuedotjs.svg' },
  { name: 'Angular', kind: 'Frontend', color: '#ff8fd0', icon: '/tech/angular.svg' },
  { name: 'NestJS', kind: 'Backend', color: '#ff8fd0', icon: '/tech/nestjs.svg' },
  { name: 'Supabase', kind: 'Data', color: '#5fd3c6', icon: '/tech/supabase.svg' },
  { name: 'Expo', kind: 'Mobile', color: '#f6ecd4', icon: '/tech/expo.svg' },
  { name: 'Capacitor', kind: 'Mobile', color: '#8bb8ff', icon: '/tech/capacitor.svg' },
  { name: 'Kotlin', kind: 'Mobile', color: '#c9a2ff', icon: '/tech/kotlin.svg' },
  { name: 'Claude', kind: 'AI', color: '#f6c56b', icon: '/tech/claude.svg' },
  { name: 'MCP', kind: 'AI', color: '#c9a2ff', icon: '/tech/modelcontextprotocol.svg' },
  { name: 'n8n', kind: 'Automation', color: '#ff8fd0', icon: '/tech/n8n.svg' },
  { name: 'Docker', kind: 'DevOps', color: '#8bb8ff', icon: '/tech/docker.svg' },
  { name: 'Nginx', kind: 'DevOps', color: '#9dffb5', icon: '/tech/nginx.svg' },
  { name: 'Cloudflare', kind: 'DevOps', color: '#f6c56b', icon: '/tech/cloudflare.svg' },
  { name: 'Git', kind: 'DevOps', color: '#ff8fd0', icon: '/tech/git.svg' },
  { name: 'TypeScript', kind: 'Language', color: '#8bb8ff', icon: '/tech/typescript.svg' },
  { name: 'JavaScript', kind: 'Language', color: '#f6ecd4', icon: '/tech/javascript.svg' },
  { name: 'Python', kind: 'Language', color: '#7fe3ff', icon: '/tech/python.svg' },
  { name: 'Java', kind: 'Language', color: '#f6c56b', icon: '/tech/java.svg' },
]

/** Visible label for each `kind` (the key stays in English for the data). */
export const KIND: Record<Tech['kind'], L10n> = {
  Frontend: { es: 'Frontend', en: 'Frontend' },
  Backend: { es: 'Backend', en: 'Backend' },
  Mobile: { es: 'Móvil', en: 'Mobile' },
  Data: { es: 'Datos', en: 'Data' },
  AI: { es: 'IA', en: 'AI' },
  Automation: { es: 'Automatización', en: 'Automation' },
  DevOps: { es: 'DevOps', en: 'DevOps' },
  Language: { es: 'Lenguaje', en: 'Language' },
}
