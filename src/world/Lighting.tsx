import { useEffect, useRef } from 'react'
import { Sky } from '@react-three/drei'
import type { DirectionalLight } from 'three'
import { QUALITY_PRESETS, useGameStore } from '@/core/store/useGameStore'
import { PARK_RADIUS } from '@/config/park'

const SUN: [number, number, number] = [120, 160, 80]

/**
 * Daylight setup. The day/night cycle (étape 9) will drive the sun position,
 * sky and the emissive intensity of signs/lamps from a single time-of-day value.
 */
export function Lighting() {
  const quality = useGameStore((s) => s.quality)
  const preset = QUALITY_PRESETS[quality]
  const sun = useRef<DirectionalLight>(null)

  useEffect(() => {
    const l = sun.current
    if (!l) return
    l.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize)
    l.shadow.map?.dispose()
    l.shadow.map = null
    l.shadow.needsUpdate = true
  }, [preset.shadowMapSize])

  const half = PARK_RADIUS + 20
  return (
    <>
      <Sky sunPosition={SUN} turbidity={6} rayleigh={1.2} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={['#cfe3f2', 220, 720]} />
      <hemisphereLight args={['#dff1ff', '#4d7a3a', 0.9]} />
      <directionalLight
        ref={sun}
        position={SUN}
        intensity={2.4}
        color="#fff3dd"
        castShadow={preset.shadows}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={10}
        shadow-camera-far={600}
      />
    </>
  )
}
