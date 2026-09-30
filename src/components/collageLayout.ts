/** Layout of the projects collage: a sparse grid (Studio Freight style) where
 *  most cells stay empty, the section title sits in the middle and project tiles
 *  + a few Y2K "decor" tiles are scattered around it.
 *
 *  Placement is 1-based grid coords: `d` = desktop (7×5), `t` = tablet 721–1024px
 *  (5×6), `m` = mobile (3×7). `[col, row, colSpan?, rowSpan?]`. An item without
 *  `m` is hidden on mobile. The top-right cell stays empty on desktop and tablet
 *  (the fixed menu button sits there).
 *
 *  Phone landscape (`max-height: 500px`) ignores the grid: projects become a
 *  horizontal, snap-scrolling strip in index order (see ProjectsCollage.css). */

export const GRID = {
  desktop: { cols: 7, rows: 5 },
  tablet: { cols: 5, rows: 6 },
  mobile: { cols: 3, rows: 7 },
}

type Place = [col: number, row: number, colSpan?: number, rowSpan?: number]

export type DecorKind = 'star' | 'badge' | 'count' | 'loader'

export type CollageItem =
  | { kind: 'project'; index: number; d: Place; t: Place; m?: Place; depth: number }
  | { kind: 'decor'; decor: DecorKind; d: Place; t: Place; m?: Place; depth: number }
  | { kind: 'title'; d: Place; t: Place; m?: Place; depth: number }

/** `depth` 0..1 → how much the tile drifts with scroll/pointer parallax. */
export const COLLAGE: CollageItem[] = [
  { kind: 'title', d: [3, 3, 3, 1], t: [2, 3, 3, 1], m: [1, 4, 3, 1], depth: 0 },

  { kind: 'project', index: 0, d: [1, 1, 2, 2], t: [1, 1, 2, 2], m: [1, 1], depth: 0.35 }, // Pickop (featured)
  { kind: 'project', index: 1, d: [6, 4, 2, 2], t: [4, 5, 2, 2], m: [3, 1], depth: 0.4 }, // Roda (featured)
  { kind: 'project', index: 2, d: [4, 1], t: [3, 1], m: [2, 2], depth: 0.7 }, // Botinfy
  { kind: 'project', index: 3, d: [5, 2], t: [4, 2], m: [3, 2], depth: 0.9 }, // Encuéntralos
  { kind: 'project', index: 4, d: [7, 2], t: [5, 2], m: [1, 3], depth: 0.55 }, // Mediart (row 2: [7,1] is under the menu button)
  { kind: 'project', index: 5, d: [1, 4], t: [1, 4], m: [1, 5], depth: 0.8 }, // Drinkers
  { kind: 'project', index: 6, d: [3, 5], t: [2, 5], m: [2, 5], depth: 0.6 }, // Pago Móvil
  { kind: 'project', index: 7, d: [4, 4], t: [3, 6], m: [2, 6], depth: 1 }, // Bistrot
  { kind: 'project', index: 8, d: [6, 2], t: [3, 4], m: [1, 7], depth: 0.5 }, // Charlotte

  { kind: 'decor', decor: 'star', d: [3, 1], t: [2, 4], m: [3, 7], depth: 1 },
  { kind: 'decor', decor: 'badge', d: [7, 3], t: [5, 3], m: [3, 3], depth: 0.75 },
  { kind: 'decor', decor: 'count', d: [1, 3], t: [1, 3], m: [3, 6], depth: 0.45 },
  { kind: 'decor', decor: 'loader', d: [5, 5], t: [1, 6], depth: 0.85 },
]

/** Pseudo-random but stable entry order, so tiles pop in scattered, not by row. */
export const entryOrder = (i: number) => (i * 5 + 3) % COLLAGE.length // 5 is coprime with 14 → a permutation
