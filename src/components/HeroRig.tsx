import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text, MeshTransmissionMaterial, MeshDistortMaterial } from '@react-three/drei'
import { MeshPhysicalMaterial, type Group, type Mesh } from 'three'

const FONT = '/fonts/Anton-Regular.ttf'

/** The name, as 3D text behind the glass so it gets refracted. It carries its
 *  own frosted-glass material (glossy, faintly iridescent, catching the studio
 *  env), gently breathes/floats, and its transparency pulses between 0.86 and 1. */
function RefractedName() {
  const group = useRef<Group>(null)

  // One glass material per line (a material can't be shared across two primitive
  // mounts). Physical + iridescence + clearcoat = the frosted-glass read.
  const mats = useMemo(
    () =>
      [0, 1].map(
        () =>
          new MeshPhysicalMaterial({
            color: '#eef1f8',
            roughness: 0.12,
            metalness: 0.1,
            iridescence: 1,
            iridescenceIOR: 1.3,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
            emissive: '#0c0e14',
            envMapIntensity: 1.5,
            transparent: true,
            opacity: 0.9,
            toneMapped: false,
          }),
      ),
    [],
  )
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const g = group.current
    if (g) {
      g.position.y = Math.sin(t * 0.5) * 0.06
      g.rotation.z = Math.sin(t * 0.3) * 0.012
      g.scale.setScalar(1 + Math.sin(t * 0.8) * 0.015)
    }
    // Transparency animation: opacity sweeps 0.86 <-> 1.0.
    const o = 0.93 + Math.sin(t * 1.2) * 0.07
    mats[0].opacity = o
    mats[1].opacity = o
  })

  const common = {
    font: FONT,
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    letterSpacing: -0.02,
    fontSize: 1.35,
  }
  return (
    <group ref={group} position={[0, 0, -0.8]}>
      <Text {...common} position={[0, 0.78, 0]}>
        ALEJANDRO
        <primitive object={mats[0]} attach="material" />
      </Text>
      <Text {...common} position={[0, -0.78, 0]}>
        CHÁVEZ
        <primitive object={mats[1]} attach="material" />
      </Text>
    </group>
  )
}

const BUBBLE_CENTER: [number, number, number] = [0.2, 0.05, 1.3]

/** Central liquid-glass bubble that refracts the name. On hover it doesn't split
 *  — it deforms: the glass ripples and wobbles like a soft liquid, then settles
 *  when the cursor leaves. A fixed invisible sphere catches the hover. */
function CenterBubble() {
  const core = useRef<Mesh>(null)
  // drei's transmission material instance — we scrub its distortion on hover.
  const mat = useRef<{
    distortion: number
    distortionScale: number
    temporalDistortion: number
  } | null>(null)
  const hovered = useRef(false)
  const p = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    p.current += ((hovered.current ? 1 : 0) - p.current) * (1 - Math.exp(-6 * delta))
    const e = p.current

    const c = core.current
    if (c) {
      c.rotation.x = t * 0.12
      c.rotation.y = t * 0.18
      // Hover wobble: squash/stretch the orb on each axis so it reads as a soft
      // liquid blob being poked, on top of its base non-uniform scale.
      const w = e * 0.14
      c.scale.set(
        0.92 * (1 + Math.sin(t * 6.0) * w),
        1.12 * (1 + Math.sin(t * 6.0 + 2.1) * w),
        0.92 * (1 + Math.sin(t * 5.2 + 4.2) * w),
      )
    }

    const m = mat.current
    if (m) {
      // Ripple the refraction more as it's hovered — the "deform" of the glass.
      m.distortion = 0.22 + e * 0.55
      m.distortionScale = 0.3 + e * 0.5
      m.temporalDistortion = 0.18 + e * 0.6
    }
  })

  return (
    <group>
      {/* Fixed invisible hit area for a stable hover. */}
      <mesh
        position={BUBBLE_CENTER}
        onPointerOver={() => (hovered.current = true)}
        onPointerOut={() => (hovered.current = false)}
      >
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.7}>
        <mesh ref={core} position={BUBBLE_CENTER} scale={[0.92, 1.12, 0.92]}>
          <sphereGeometry args={[0.85, 96, 96]} />
          <MeshTransmissionMaterial
            ref={mat as never}
            transmission={1}
            thickness={0.8}
            roughness={0.03}
            ior={1.38}
            chromaticAberration={0.06}
            anisotropicBlur={0.1}
            distortion={0.22}
            distortionScale={0.3}
            temporalDistortion={0.18}
            clearcoat={1}
            clearcoatRoughness={0.04}
            color="#ffffff"
            transparent
          />
        </mesh>
      </Float>
    </group>
  )
}

/** Liquid-chrome Y2K form. Sits behind a glass bubble so the bubble refracts
 *  it (giving the glass something to show), and reads as a metal accent itself. */
function ChromeForm({
  position,
  rotation,
  scale,
  floatSpeed,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  floatSpeed: number
}) {
  return (
    <Float speed={floatSpeed} rotationIntensity={1.4} floatIntensity={1}>
      <mesh position={position} rotation={rotation} scale={scale}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color="#f2f5fa"
          metalness={1}
          roughness={0.14}
          envMapIntensity={2.4}
          distort={0.55}
          speed={1.6}
        />
      </mesh>
    </Float>
  )
}

/** Thin chrome orbital rings, slowly precessing. */
function OrbitRings() {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const g = ref.current
    if (!g) return
    g.rotation.z = t * 0.08
    g.rotation.x = Math.PI / 2.3 + Math.sin(t * 0.2) * 0.1
  })
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[3.1, 0.006, 16, 200]} />
        <meshStandardMaterial color="#e6e8ec" metalness={1} roughness={0.3} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2.6, 0]}>
        <torusGeometry args={[2.7, 0.005, 16, 200]} />
        <meshStandardMaterial color="#cdd0d6" metalness={1} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** The whole hero rig — refracted name, deforming centre bubble, chrome Y2K
 *  accents and orbital rings. WorldScene animates it as one group on scroll. */
export function HeroRig() {
  return (
    <>
      <RefractedName />
      <CenterBubble />
      <ChromeForm position={[-4.4, 0.9, -2]} rotation={[0.4, 0.6, -0.5]} scale={[0.95, 0.68, 0.68]} floatSpeed={1.4} />
      <ChromeForm position={[4.5, -0.9, -2]} rotation={[-0.3, -0.5, 0.6]} scale={[0.8, 0.58, 0.58]} floatSpeed={1.8} />
      <OrbitRings />
    </>
  )
}
