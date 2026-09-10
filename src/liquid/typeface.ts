/**
 * Display face for the name. Anton is the reference weight: heavy, condensed,
 * flat terminals, so it survives being blurred into liquid tubes.
 */
export const DISPLAY_FONT =
  '"Anton", "Haettenschweiler", "Arial Narrow", Impact, "Franklin Gothic Heavy", sans-serif'

const SAMPLE = 'ALEJANDRO CHAVEZ'

const shrug = () => undefined

/** Resolves once the display face is usable by canvas, or gave up trying. */
export async function ensureDisplayFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  await document.fonts.load('400 320px "Anton"', SAMPLE).catch(shrug)
  await document.fonts.ready.catch(shrug)
}
