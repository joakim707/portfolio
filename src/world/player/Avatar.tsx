import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Group, MeshStandardMaterial } from 'three'

const skin = new MeshStandardMaterial({ color: '#8d5524', roughness: 0.8 })
const shirt = new MeshStandardMaterial({ color: '#ff4d6d', roughness: 0.8 })
const pants = new MeshStandardMaterial({ color: '#1d2b53', roughness: 0.9 })
const shoes = new MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.7 })
const hair = new MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 })
const cap = new MeshStandardMaterial({ color: '#f6c445', roughness: 0.7 })

export interface AvatarHandle {
  /** Advance the procedural walk cycle. speed in m/s. */
  animate(dt: number, speed: number, grounded: boolean, seated?: boolean): void
  /** Hide the head for the on-board POV camera (the eyes sit inside it). */
  setHeadVisible(visible: boolean): void
}

/**
 * Procedural low-poly visitor (≈1.8 m), facing -Z, feet at y = 0.
 * Limbs pivot at hips/shoulders so the walk cycle is a simple rotation.
 * Can be swapped later for a rigged GLB without touching the controller.
 */
export const Avatar = forwardRef<AvatarHandle>(function Avatar(_, ref) {
  const body = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const head = useRef<Group>(null)
  const phase = useRef(0)
  const blend = useRef(0)
  const idle = useRef(0)

  useImperativeHandle(ref, () => ({
    setHeadVisible(visible) {
      if (head.current) head.current.visible = visible
    },
    animate(dt, speed, grounded, seated = false) {
      const moving = Math.min(speed / 4.5, 1.6)
      blend.current += (moving - blend.current) * Math.min(1, dt * 10)
      phase.current += dt * (4 + speed * 1.1)
      idle.current += dt
      const amp = blend.current * 0.55
      const s = Math.sin(phase.current)
      if (legL.current && legR.current && armL.current && armR.current && body.current) {
        if (seated) {
          // legs forward from the hips, hands up on the restraint
          legL.current.rotation.x = legR.current.rotation.x = 1.45
          armL.current.rotation.x = armR.current.rotation.x = 1.15
          body.current.position.y = 0
          body.current.rotation.x = 0
          return
        }
        if (!grounded) {
          // airborne pose
          legL.current.rotation.x = 0.5
          legR.current.rotation.x = -0.3
          armL.current.rotation.x = armR.current.rotation.x = -0.6
          return
        }
        legL.current.rotation.x = s * amp
        legR.current.rotation.x = -s * amp
        armL.current.rotation.x = -s * amp * 0.9
        armR.current.rotation.x = s * amp * 0.9
        body.current.position.y = Math.abs(Math.cos(phase.current)) * 0.06 * blend.current + Math.sin(idle.current * 2) * 0.008
        body.current.rotation.x = -0.08 * blend.current // lean forward when running
      }
    },
  }))

  return (
    <group ref={body}>
      {/* legs: pivot at the hip (y = 0.9) */}
      {[
        { r: legL, x: -0.13 },
        { r: legR, x: 0.13 },
      ].map(({ r, x }) => (
        <group key={x} ref={r} position={[x, 0.9, 0]}>
          <mesh position-y={-0.42} material={pants} castShadow>
            <boxGeometry args={[0.2, 0.84, 0.22]} />
          </mesh>
          <mesh position={[0, -0.86, -0.05]} material={shoes} castShadow>
            <boxGeometry args={[0.22, 0.1, 0.34]} />
          </mesh>
        </group>
      ))}
      {/* torso */}
      <mesh position-y={1.2} material={shirt} castShadow>
        <boxGeometry args={[0.48, 0.62, 0.28]} />
      </mesh>
      <mesh position-y={0.93} material={pants} castShadow>
        <boxGeometry args={[0.46, 0.12, 0.27]} />
      </mesh>
      {/* arms: pivot at the shoulder */}
      {[
        { r: armL, x: -0.31 },
        { r: armR, x: 0.31 },
      ].map(({ r, x }) => (
        <group key={x} ref={r} position={[x, 1.46, 0]}>
          <mesh position-y={-0.26} material={shirt} castShadow>
            <boxGeometry args={[0.14, 0.52, 0.16]} />
          </mesh>
          <mesh position-y={-0.58} material={skin} castShadow>
            <boxGeometry args={[0.12, 0.14, 0.13]} />
          </mesh>
        </group>
      ))}
      {/* head */}
      <group ref={head}>
      <mesh position-y={1.58} material={skin}>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 8]} />
      </mesh>
      <mesh position-y={1.74} material={skin} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
      </mesh>
      <mesh position={[0, 1.9, 0.02]} material={hair} castShadow>
        <boxGeometry args={[0.32, 0.08, 0.32]} />
      </mesh>
      {/* cap with visor pointing forward (-Z) */}
      <mesh position={[0, 1.93, 0]} material={cap}>
        <boxGeometry args={[0.33, 0.07, 0.33]} />
      </mesh>
      <mesh position={[0, 1.91, -0.22]} material={cap}>
        <boxGeometry args={[0.3, 0.03, 0.16]} />
      </mesh>
      {/* eyes */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 1.76, -0.151]} rotation-y={Math.PI} material={hair}>
          <planeGeometry args={[0.04, 0.05]} />
        </mesh>
      ))}
      </group>
    </group>
  )
})
