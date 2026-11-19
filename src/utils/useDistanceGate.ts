import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'

const tmp = new Vector3()

/**
 * Returns a ref that is true while the camera is within `maxDistance` of
 * `position`. Decorative animations check it to skip work far away.
 * Checked a few times per second only.
 */
export function useDistanceGate(position: [number, number, number], maxDistance: number) {
  const near = useRef(true)
  const acc = useRef(0)
  useFrame(({ camera }, dt) => {
    acc.current += dt
    if (acc.current < 0.25) return
    acc.current = 0
    near.current = camera.position.distanceTo(tmp.set(...position)) < maxDistance
  })
  return near
}
