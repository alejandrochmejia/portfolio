import { PROJECTS } from './projectsData.ts'

/** Clamp `v` into the `[a, b]` range. */
export const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

/** The field is a two-row grid of columns: three columns sit centred on screen
 *  and the rest live off to the right, revealed by panning. Each project fills a
 *  slot top-then-bottom per column, so appended projects extend rightward. */
export const COL_GAP = 2.6
export const ROW_Y = 1.12
const VISIBLE_COLS = 3

const NUM_COLS = Math.ceil(PROJECTS.length / 2)

/** How far the field can pan so the last columns reach the centred window. */
export const MAX_PAN = Math.max(0, (NUM_COLS - VISIBLE_COLS) * COL_GAP)

/** Resting slot (before drift/pan) for a project by its index. */
export function slotFor(index: number) {
  const col = Math.floor(index / 2)
  const row = index % 2
  const x = col * COL_GAP - COL_GAP // col 0 → -COL_GAP, col 1 → 0, col 2 → +COL_GAP …
  const y = row === 0 ? ROW_Y : -ROW_Y
  const z = (col + row) % 2 === 0 ? 0.28 : -0.15
  return { x, y, z }
}
