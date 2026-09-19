import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  Float,
  Text,
  MeshTransmissionMaterial,
  MeshDistortMaterial,
  Sparkles,
} from '@react-three/drei'
import { MeshPhysicalMaterial, type Group, type Material, type Mesh } from 'three'

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

/** Where each shard flies to on hover (mostly the laterals). */
const SHARDS: { target: [number, number, number]; scale: number }[] = [
  { target: [-3.6, 1.4, 1.1], scale: 0.42 },
  { target: [-3.1, -0.3, 1.3], scale: 0.5 },
  { target: [-2.7, -1.9, 1.1], scale: 0.34 },
  { target: [3.6, 1.5, 1.1], scale: 0.44 },
  { target: [3.1, -0.5, 1.3], scale: 0.48 },
  { target: [2.8, -1.9, 1.1], scale: 0.32 },
]

/** Central liquid-glass bubble that refracts the name. On hover it splits into
 *  smaller bubbles that scatter to the sides (revealing the name); on hover-out
 *  they fly back to the centre and recombine. A fixed invisible sphere catches
 *  the hover so the shrinking bubble can't cause flicker. */
function CenterBubble() {
  const core = useRef<Mesh>(null)
  const shards = useRef<(Mesh | null)[]>([])
  const hovered = useRef(false)
  const p = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    p.current += ((hovered.current ? 1 : 0) - p.current) * (1 - Math.exp(-7 * delta))
    const e = p.current * p.current * (3 - 2 * p.current) // smoothstep

    const c = core.current
    if (c) {
      c.rotation.x = t * 0.12
      c.rotation.y = t * 0.18
      const s = 1 - 0.92 * e
      c.scale.set(0.92 * s, 1.12 * s, 0.92 * s)
      ;(c.material as Material).opacity = 1 - e
    }

    for (let i = 0; i < SHARDS.length; i++) {
      const m = shards.current[i]
      if (!m) continue
      const sh = SHARDS[i]
      m.position.set(
        BUBBLE_CENTER[0] + (sh.target[0] - BUBBLE_CENTER[0]) * e,
        BUBBLE_CENTER[1] + (sh.target[1] - BUBBLE_CENTER[1]) * e,
        BUBBLE_CENTER[2] + (sh.target[2] - BUBBLE_CENTER[2]) * e,
      )
      m.scale.setScalar(sh.scale * e)
      m.rotation.x = t * 0.3 + i
      m.rotation.y = t * 0.45 + i
    }
  })

  return (
    <group>
      {/* Fixed invisible hit area — keeps hover stable while the bubble splits. */}
      <mesh
        position={BUBBLE_CENTER}
        onPointerOver={() => (hovered.current = true)}
        onPointerOut={() => (hovered.current = false)}
      >
        <sphereGeometry args={[1.15, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.7}>
        <mesh ref={core} position={BUBBLE_CENTER} scale={[0.92, 1.12, 0.92]}>
          <sphereGeometry args={[0.85, 96, 96]} />
          <MeshTransmissionMaterial
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

      {/* Shards: cheap physical-transmission glass so all six share one pass. */}
      {SHARDS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            shards.current[i] = el
          }}
          position={BUBBLE_CENTER}
          scale={0}
        >
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial
            transmission={1}
            thickness={0.3}
            roughness={0.06}
            ior={1.3}
            iridescence={1}
            iridescenceIOR={1.3}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1}
            transparent
            color="#ffffff"
          />
        </mesh>
      ))}
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

export function Scene() {
  return (
    <>
      <color attach="background" args={['#050506']} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />

      <RefractedName />
      <CenterBubble />

      {/* Chrome Y2K accents on the sides, tucked behind the name. */}
      <ChromeForm position={[-4.4, 0.9, -2]} rotation={[0.4, 0.6, -0.5]} scale={[0.95, 0.68, 0.68]} floatSpeed={1.4} />
      <ChromeForm position={[4.5, -0.9, -2]} rotation={[-0.3, -0.5, 0.6]} scale={[0.8, 0.58, 0.58]} floatSpeed={1.8} />

      <OrbitRings />

      <Sparkles count={45} scale={[10, 7, 4]} size={3} speed={0.25} color="#ffffff" opacity={0.7} />

      {/* Studio env for the chrome reflections — white key with blue/pink rims
          for the iridescent Y2K edges. No external HDRI needed. */}
      {/* A wrap-around light box: bright panels on every side so the chrome
          reflects light (not the black void), with a blue left rim and pink
          right rim for the iridescent Y2K edges. The scene background stays
          black — this only feeds reflections/IBL. */}
      <Environment resolution={512}>
        {/* Huge, overlapping panels so the glass catches smooth gradients rather
            than hard-edged shapes. A big dim front fill keeps the camera-facing
            side from going black; blue left / pink right give the iridescence. */}
        <Lightformer form="rect" intensity={1.6} position={[0, 0, 12]} scale={[50, 50, 1]} color="#c7d0e2" />
        <Lightformer form="rect" intensity={3} position={[0, 9, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[30, 30, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[0, -9, 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[30, 30, 1]} color="#dfe6ff" />
        <Lightformer form="rect" intensity={6} position={[-12, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[30, 20, 1]} color="#5f9bff" />
        <Lightformer form="rect" intensity={6} position={[12, -1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[30, 20, 1]} color="#ff6fc0" />
      </Environment>
    </>
  )
}
