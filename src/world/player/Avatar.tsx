import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { LoopRepeat, Mesh, type AnimationAction, type Group, type Object3D } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { avatarMetrics } from '@/core/rides/runtime'
import { CHARACTER_SCALE, SIT_HIP, characterUrl } from './characters'

export interface AvatarHandle {
  /** Pick the animation for the current motion. speed in m/s. */
  animate(dt: number, speed: number, grounded: boolean, seated?: boolean): void
  /** Hide the head for the on-board POV camera (the eyes sit inside it). */
  setHeadVisible(visible: boolean): void
}

type Clip = 'idle' | 'walk' | 'sprint' | 'fall' | 'sit'
const FADE = 0.2
/** Below this airtime a step down is not worth a falling pose. */
const FALL_DELAY = 0.18

/**
 * Kenney Mini Characters visitor, facing −Z, feet at y = 0.
 * Same handle as before, so the player rig and rides are unchanged.
 */
export const Avatar = forwardRef<AvatarHandle, { character: string }>(function Avatar({ character }, ref) {
  const { scene, animations } = useGLTF(characterUrl(character))
  // skinned meshes must be cloned with their skeleton (the cached scene is shared)
  const model = useMemo(() => cloneSkinned(scene), [scene])
  const root = useRef<Group>(null)
  const { actions } = useAnimations(animations, root)
  const current = useRef<Clip | null>(null)
  const airtime = useRef(0)
  const head = useMemo<Object3D | undefined>(() => model.getObjectByName('head'), [model])

  useEffect(() => {
    model.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true
        // skinned bounds follow the bind pose, not the animation: avoid popping out
        o.frustumCulled = false
      }
    })
  }, [model])

  // tell the ride system how this model sits (seat hip point → model origin)
  useEffect(() => {
    avatarMetrics.seatDrop = SIT_HIP
  }, [])

  const play = (clip: Clip, timeScale = 1) => {
    const next = actions[clip] as AnimationAction | null | undefined
    if (!next) return
    next.timeScale = timeScale
    if (current.current === clip) return
    const prev = current.current ? (actions[current.current] as AnimationAction | null) : null
    next.reset().setLoop(LoopRepeat, Infinity).setEffectiveWeight(1).play()
    if (prev) next.crossFadeFrom(prev, FADE, false)
    current.current = clip
  }

  useEffect(() => {
    current.current = null
    play('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  useImperativeHandle(ref, () => ({
    animate(dt, speed, grounded, seated = false) {
      if (seated) return play('sit')
      airtime.current = grounded ? 0 : airtime.current + dt
      if (airtime.current > FALL_DELAY) return play('fall')
      if (speed > 6.5) return play('sprint', Math.min(1.4, Math.max(0.7, speed / 9)))
      if (speed > 0.3) return play('walk', Math.min(1.5, Math.max(0.6, speed / 4.2)))
      play('idle')
    },
    setHeadVisible(visible) {
      if (head) head.scale.setScalar(visible ? 1 : 0.001)
    },
  }))

  return (
    <group ref={root}>
      {/* Kenney characters face +Z; our avatar convention is −Z */}
      <primitive object={model} scale={CHARACTER_SCALE} rotation-y={Math.PI} />
    </group>
  )
})
