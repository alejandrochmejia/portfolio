import { useId, type CSSProperties } from 'react'
import './y2k.css'

/** Shared Y2K ornaments (chrome star, spinning ring badge, segmented loader,
 *  OS-window dots, blinking status dot) used by the About overlay and the
 *  projects collage. All purely decorative → aria-hidden. */

/** Four-point chrome sparkle, slowly spinning. */
export function ChromeStar({ className = '' }: { className?: string }) {
  const id = useId()
  return (
    <svg className={`y2k-star ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#8f96a6" />
          <stop offset="0.55" stopColor="#f4f6fb" />
          <stop offset="0.8" stopColor="#5d6372" />
          <stop offset="1" stopColor="#e9ecf3" />
        </linearGradient>
      </defs>
      <path d="M50 2 C54 38 62 46 98 50 C62 54 54 62 50 98 C46 62 38 54 2 50 C38 46 46 38 50 2Z" fill={`url(#${id})`} />
    </svg>
  )
}

/** Circular text ring (rotating) with a gradient ✦ at its core. */
export function RingBadge({ text, className = '' }: { text: string; className?: string }) {
  const id = useId()
  return (
    <div className={`y2k-badge ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path id={id} d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
        </defs>
        <text>
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="y2k-badge__core">✦</span>
    </div>
  )
}

/** Segmented "loading" bar whose blocks light up in sequence. */
export function SegLoader({ count = 10 }: { count?: number }) {
  return (
    <span className="y2k-seg" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} style={{ '--k': i } as CSSProperties} />
      ))}
    </span>
  )
}

/** Blue / pink / cream window-control dots. */
export function WindowDots() {
  return (
    <span className="y2k-dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

/** Green "online" status dot that blinks. */
export function Blink() {
  return <i className="y2k-blink" aria-hidden="true" />
}
