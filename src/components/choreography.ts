/** Scroll choreography for the single World journey. `progress` runs 0→1 across
 *  the pinned section; these windows say when each phase enters and leaves, so
 *  WorldScene, FieldOrb and the World overlay all read from one source. */

/** Linear 0→1 ramp of `p` across the window [a, b]. */
export const track = (p: number, a: number, b: number) => Math.min(Math.max((p - a) / (b - a), 0), 1)

export const HERO_OUT: [number, number] = [0.03, 0.11] // hero rises + shrinks away
export const ABOUT_IN: [number, number] = [0.14, 0.22] // curved marquee arrives
export const ABOUT_OUT: [number, number] = [0.34, 0.42] // …and leaves
export const FIELD_IN: [number, number] = [0.47, 0.57] // projects collage appears
export const FIELD_OUT: [number, number] = [0.86, 0.96] // …and exit
