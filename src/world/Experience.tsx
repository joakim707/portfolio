import { Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { QUALITY_PRESETS, useGameStore } from '@/core/store/useGameStore'
import { Lighting } from './Lighting'
import { Park } from './Park'
import { CameraDirector } from './CameraDirector'
import { Player } from './player/Player'

const DEBUG_PHYSICS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

/** Rendered once everything above it has finished suspending (Rapier WASM, textures). */
function ReadySignal() {
  useEffect(() => {
    const s = useGameStore.getState()
    if (s.phase === 'loading') s.setPhase('intro')
  }, [])
  return null
}

/** DEV: exposes the final camera position of each frame to browser tests. */
function DevProbe() {
  useFrame(({ camera }) => {
    ;(window as unknown as { __cam?: number[] }).__cam = camera.position.toArray()
  })
  return null
}

export function Experience() {
  const quality = useGameStore((s) => s.quality)
  const setQuality = useGameStore((s) => s.setQuality)
  const preset = QUALITY_PRESETS[quality]

  return (
    <Canvas
      shadows={preset.shadows ? 'percentage' : false}
      dpr={preset.dpr}
      camera={{ fov: 55, near: 0.5, far: 1400, position: [0, 30, 260] }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', outputColorSpace: SRGBColorSpace, toneMapping: ACESFilmicToneMapping }}
    >
      {/* Drop one quality level automatically if the frame rate collapses. */}
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          if (quality === 'high') setQuality('medium')
          else if (quality === 'medium') setQuality('low')
        }}
      />
      <AdaptiveDpr />
      <Lighting />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} debug={DEBUG_PHYSICS} timeStep="vary">
          <Park />
          <Player />
          {import.meta.env.DEV && <DevProbe />}
        </Physics>
        <ReadySignal />
      </Suspense>
      <CameraDirector />
    </Canvas>
  )
}
