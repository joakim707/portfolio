import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { Vector3 } from 'three'
import { useGameStore } from '@/core/store/useGameStore'
import { ENTRANCE_Z } from '@/config/park'
import { followCameraPose, teleportPose } from './player/rig'

/**
 * Intro cinematic: a high pass over the whole park, then down through the
 * gate, landing exactly on the follow camera's starting pose so the hand-off
 * to the player rig is seamless. Cinematic ride cameras will live here too.
 */
export function CameraDirector() {
  const camera = useThree((s) => s.camera)
  const phase = useGameStore((s) => s.phase)
  const reduceFx = useGameStore((s) => s.comfort.reduceCameraFx)

  useEffect(() => {
    if (phase !== 'intro') return
    const spawn = teleportPose('entrance')
    const end = followCameraPose(spawn.feet, spawn.yaw)
    const look = new Vector3(0, 0, -20)
    const pos = camera.position

    pos.set(-170, 120, -120)
    camera.lookAt(look)
    const update = () => camera.lookAt(look)
    const tl = gsap.timeline({
      onUpdate: update,
      onComplete: () => {
        const s = useGameStore.getState()
        if (s.phase === 'intro') s.setPhase('explore')
      },
    })
    // sweep around the park
    tl.to(pos, { x: 190, y: 95, z: 40, duration: 4.5, ease: 'sine.inOut' })
      .to(look, { x: 0, y: 0, z: 10, duration: 4.5, ease: 'sine.inOut' }, '<')
      // glide over the gate
      .to(pos, { x: 0, y: 30, z: ENTRANCE_Z + 45, duration: 2.6, ease: 'power2.inOut' })
      .to(look, { x: 0, y: 14, z: ENTRANCE_Z, duration: 2.6, ease: 'power2.inOut' }, '<')
      // settle behind the visitor
      .to(pos, { x: end.pos.x, y: end.pos.y, z: end.pos.z, duration: 2, ease: 'power2.out' })
      .to(look, { x: end.target.x, y: end.target.y, z: end.target.z, duration: 2, ease: 'power2.out' }, '<')
    if (reduceFx) tl.timeScale(3)
    return () => {
      tl.kill()
    }
  }, [phase, camera, reduceFx])

  return null
}
