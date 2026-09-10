import { useState } from 'react'
import { LiquidName, type LiquidStatus } from './LiquidName.tsx'
import './Hero.css'

/** Each line is typeset to span the full width, so the break is deliberate. */
const NAME_LINES = ['ALEJANDRO', 'CHÁVEZ']

const STATE: Record<LiquidStatus, string | undefined> = {
  idle: undefined,
  ready: 'on',
  unsupported: 'off',
}

export function Hero() {
  const [status, setStatus] = useState<LiquidStatus>('idle')

  return (
    <section className="hero" data-liquid={STATE[status]}>
      <LiquidName lines={NAME_LINES} onStatus={setStatus} />

      <h1 className="hero__name">
        <span className="hero__line">Alejandro</span>
        <span className="hero__line">Chávez</span>
      </h1>

      <svg className="hero__defs" aria-hidden="true" focusable="false">
        <filter
          id="liquid-fallback"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.004 0.0068"
            numOctaves="3"
            seed="11"
            result="field"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="soft" />
          <feDisplacementMap
            in="soft"
            in2="field"
            scale="42"
            xChannelSelector="R"
            yChannelSelector="G"
            result="liquid"
          />
          <feGaussianBlur in="liquid" stdDeviation="5" result="melted" />
          <feComponentTransfer in="melted">
            <feFuncA type="table" tableValues="0 0.35 0.8 1 1" />
          </feComponentTransfer>
        </filter>
      </svg>
    </section>
  )
}
