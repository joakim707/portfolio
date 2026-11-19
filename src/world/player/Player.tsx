import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier'
import { Group, Vector3, type PerspectiveCamera } from 'three'
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat'
import { ATTRACTIONS } from '@/data/attractions'
import { Controls } from '@/core/input/keymap'
import { isDown } from '@/core/input/keyboard'
import { useGameStore } from '@/core/store/useGameStore'
import { playerBridge, rideRuntimes } from '@/core/rides/runtime'
import { RideCameraRig } from '@/core/rides/RideCameraRig'
import { Avatar, type AvatarHandle } from './Avatar'
import {
  CAMERA,
  CAPSULE_HALF,
  CAPSULE_RADIUS,
  CENTER_HEIGHT,
  GRAVITY,
  RUN_SPEED,
  WALK_SPEED,
  cameraDirection,
  teleportPose,
  yawFromDirection,
  zoneEntrance,
} from './rig'

const ENTRANCES = ATTRACTIONS.map((a) => ({ id: a.id, ...zoneEntrance(a) }))
const PROXIMITY = 9

const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt))
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Third-person visitor: Rapier kinematic character controller (slides along
 * walls, climbs small steps, snaps to the ground) + an orbiting follow camera
 * that shortens itself when something stands between it and the player.
 * Movement and camera run in the same frame callback, movement first, so the
 * camera never lags one frame behind the avatar.
 */
export function Player() {
  const { world, rapier } = useRapier()
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)

  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const visual = useRef<Group>(null)
  const avatar = useRef<AvatarHandle>(null)

  const spawn = useMemo(() => teleportPose('entrance'), [])
  const state = useRef({
    velY: 0,
    grounded: false,
    facing: spawn.yaw,
    camYaw: spawn.yaw,
    camPitch: CAMERA.pitch,
    camDist: CAMERA.distance,
    wantedDist: CAMERA.distance,
    proximityTimer: 0,
    lastTeleport: 0,
    /** True while a ride owns the visitor (no physics, no input). */
    captured: false,
  })
  const rideRig = useMemo(() => new RideCameraRig(), [])

  // Created in an effect (not useMemo) so StrictMode's mount/unmount/mount
  // cycle never leaves us holding a controller that Rapier already freed.
  const controllerRef = useRef<KinematicCharacterController | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.02)
    c.setUp({ x: 0, y: 1, z: 0 })
    c.enableAutostep(0.35, 0.25, false)
    c.enableSnapToGround(0.35)
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180)
    c.setMinSlopeSlideAngle((35 * Math.PI) / 180)
    c.setSlideEnabled(true)
    c.setApplyImpulsesToDynamicBodies(false)
    controllerRef.current = c
    return () => {
      controllerRef.current = null
      world.removeCharacterController(c)
    }
  }, [world])

  // ── mouse look: pointer lock when available, click-drag otherwise; wheel zooms ──
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    const look = (dx: number, dy: number) => {
      const s = state.current
      s.camYaw -= dx * CAMERA.sensitivity
      s.camPitch = Math.min(CAMERA.maxPitch, Math.max(CAMERA.minPitch, s.camPitch + dy * CAMERA.sensitivity))
    }
    const onMove = (e: PointerEvent) => {
      const phase = useGameStore.getState().phase
      if (phase !== 'explore' && phase !== 'riding') return
      if (document.pointerLockElement !== el && !dragging) return
      if (phase === 'riding') {
        if (rideRig.isActive) rideRig.look(e.movementX, e.movementY, CAMERA.sensitivity)
        else if (state.current.captured) look(e.movementX, e.movementY)
      } else look(e.movementX, e.movementY)
    }
    const onDown = (e: PointerEvent) => {
      const phase = useGameStore.getState().phase
      if (phase !== 'explore' && phase !== 'riding') return
      if (e.pointerType === 'mouse' && document.pointerLockElement !== el) {
        // first click captures the mouse; if the browser refuses, drag-to-look still works
        Promise.resolve(el.requestPointerLock?.()).catch(() => {})
      }
      dragging = true
    }
    const onUp = () => {
      dragging = false
    }
    const onWheel = (e: WheelEvent) => {
      if (useGameStore.getState().phase !== 'explore') return
      const s = state.current
      s.wantedDist = Math.min(CAMERA.maxDistance, Math.max(CAMERA.minDistance, s.wantedDist * (1 + Math.sign(e.deltaY) * 0.12)))
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, rideRig])

  // ── bridge used by ride runtimes to take and give back the visitor ──
  useEffect(() => {
    playerBridge.current = {
      getPose(out) {
        const p = body.current?.translation()
        if (p) out.set(p.x, p.y - CENTER_HEIGHT, p.z)
        return state.current.facing
      },
      capture() {
        state.current.captured = true
        collider.current?.setEnabled(false)
      },
      release(feet, yaw) {
        const s = state.current
        const p = { x: feet.x, y: feet.y + CENTER_HEIGHT + 0.05, z: feet.z }
        body.current?.setTranslation(p, true)
        body.current?.setNextKinematicTranslation(p)
        collider.current?.setEnabled(true)
        s.captured = false
        s.velY = 0
        s.facing = s.camYaw = yaw
        s.camPitch = CAMERA.pitch
        s.camDist = s.wantedDist
        s.proximityTimer = Infinity
      },
    }
    return () => {
      playerBridge.current = null
    }
  }, [])

  const tmp = useMemo(
    () => ({ move: new Vector3(), next: new Vector3(), target: new Vector3(), dir: new Vector3(), ray: new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }),
      down: new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
    }),
    [rapier],
  )

  useFrame((_, rawDt) => {
    const rb = body.current
    const col = collider.current
    const controller = controllerRef.current
    if (!rb || !col || !controller) return
    const dt = Math.min(rawDt, 1 / 20)
    const s = state.current
    const store = useGameStore.getState()
    const { phase } = store
    const cam = camera as PerspectiveCamera

    // ── visitor owned by a ride (boarding → unboarding hand-off) ──
    if (s.captured) {
      const ride = store.activeRide ? rideRuntimes.get(store.activeRide.id) : undefined
      if (ride && ride.passengerMode !== 'free' && visual.current) {
        ride.passengerMatrix.decompose(visual.current.position, visual.current.quaternion, visual.current.scale)
        const seated = ride.passengerMode === 'seated'
        avatar.current?.animate(dt, ride.passengerMode === 'walking' ? 1.6 : 0, true, seated)
      }
      if (ride && ride.cameraOwner === 'ride') {
        const pov = store.rideCamera === 'pov' && ride.cameraShot === 'onboard'
        avatar.current?.setHeadVisible(!pov)
        rideRig.update(cam, ride, store.rideCamera, store.comfort, dt)
        return
      }
      // before the fade (boarding) the follow camera keeps framing the avatar
      avatar.current?.setHeadVisible(true)
      if (rideRig.isActive) rideRig.release(cam)
      if (visual.current) followCamera(tmp.next.copy(visual.current.position).setY(visual.current.position.y + CENTER_HEIGHT), dt)
      return
    }
    if (rideRig.isActive) {
      rideRig.release(cam)
      avatar.current?.setHeadVisible(true)
    }

    // ── teleport requests (map / pause menu) ──
    if (store.teleport && store.teleport.nonce !== s.lastTeleport) {
      s.lastTeleport = store.teleport.nonce
      const pose = teleportPose(store.teleport.target)
      const p = { x: pose.feet[0], y: pose.feet[1] + CENTER_HEIGHT + 0.05, z: pose.feet[2] }
      rb.setTranslation(p, true)
      rb.setNextKinematicTranslation(p)
      s.velY = 0
      s.facing = s.camYaw = pose.yaw
      s.camPitch = CAMERA.pitch
      s.camDist = s.wantedDist
      s.proximityTimer = Infinity // refresh the entrance prompt right away
    }

    // ── movement ──
    const canMove = phase === 'explore'
    let ix = 0
    let iz = 0
    if (canMove) {
      ix = (isDown(Controls.right) ? 1 : 0) - (isDown(Controls.left) ? 1 : 0)
      iz = (isDown(Controls.forward) ? 1 : 0) - (isDown(Controls.backward) ? 1 : 0)
    }
    const speed = isDown(Controls.run) ? RUN_SPEED : WALK_SPEED
    const { move } = tmp
    move.set(0, 0, 0)
    if (ix || iz) {
      // relative to the camera: forward = (-sin, -cos), right = (cos, -sin)
      const sy = Math.sin(s.camYaw)
      const cy = Math.cos(s.camYaw)
      move.set(-sy * iz + cy * ix, 0, -cy * iz - sy * ix).normalize().multiplyScalar(speed * dt)
      const targetYaw = yawFromDirection(move.x, move.z)
      s.facing += wrapAngle(targetYaw - s.facing) * (1 - Math.exp(-14 * dt))
    }
    // No extra downward push while grounded: snap-to-ground keeps contact on
    // slopes, and a constant push makes Rapier's controller sink into the floor.
    s.velY = s.grounded ? 0 : Math.max(s.velY - GRAVITY * dt, -40)
    move.y = s.velY * dt

    controller.computeColliderMovement(col, move, rapier.QueryFilterFlags.EXCLUDE_SENSORS)
    const m = controller.computedMovement()
    s.grounded = controller.computedGrounded()
    const cur = rb.translation()
    const next = tmp.next.set(cur.x + m.x, cur.y + m.y, cur.z + m.z)
    // Safety net: Rapier's controller can sink a few cm when pushed into a
    // wall/floor corner. Measure the real floor under the capsule and lift it
    // back out if needed (also covers raised platforms later).
    if (s.grounded || next.y < CENTER_HEIGHT) {
      tmp.down.origin = { x: next.x, y: next.y + 0.5, z: next.z }
      const floor = world.castRay(tmp.down, CENTER_HEIGHT + 1.5, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, rb)
      const floorY = floor ? next.y + 0.5 - floor.timeOfImpact : 0
      if (next.y < floorY + CENTER_HEIGHT) {
        next.y = floorY + CENTER_HEIGHT
        if (s.velY < 0) s.velY = 0
      }
    }
    rb.setNextKinematicTranslation(next)
    if (import.meta.env.DEV) (window as unknown as { __ww?: object }).__ww = { x: next.x, y: next.y, z: next.z, grounded: s.grounded, yaw: s.camYaw }

    // ── avatar ──
    if (visual.current) {
      visual.current.position.set(next.x, next.y - CENTER_HEIGHT, next.z)
      // full reset (not just .y): a ride may have left seat pitch/roll on the avatar
      visual.current.rotation.set(0, s.facing, 0)
    }
    const horizontal = dt > 0 ? Math.hypot(m.x, m.z) / dt : 0
    avatar.current?.animate(dt, horizontal, s.grounded)

    // ── proximity to attraction entrances (a few times per second) ──
    s.proximityTimer += dt
    if (s.proximityTimer > 0.2) {
      s.proximityTimer = 0
      let near: (typeof ENTRANCES)[number]['id'] | null = null
      let best = PROXIMITY
      for (const e of ENTRANCES) {
        const d = Math.hypot(next.x - e.x, next.z - e.z)
        if (d < best) {
          best = d
          near = e.id
        }
      }
      // ride boarding areas (queue / platform) also count
      for (const [id, ride] of rideRuntimes) {
        const bp = ride.boardingPoint(tmp.target)
        if (bp && ride.config.boarding && Math.hypot(next.x - bp.x, next.z - bp.z) < ride.config.boarding.radius) near = id
      }
      store.setNearZone(near)
    }

    // ── follow camera (intro owns the camera until it ends) ──
    if (phase === 'intro' || phase === 'loading') return
    followCamera(next, dt)
  })

  /** Third-person orbit camera around a capsule-centre position. */
  function followCamera(centre: Vector3, dt: number) {
    const s = state.current
    const rb = body.current!
    const reduceFx = useGameStore.getState().comfort.reduceCameraFx
    s.camDist = damp(s.camDist, s.wantedDist, reduceFx ? 30 : 8, dt)
    const target = tmp.target.set(centre.x, centre.y + CAMERA.targetHeight, centre.z)
    const dir = cameraDirection(s.camYaw, s.camPitch, tmp.dir)
    // pull the camera in front of any obstacle between it and the player
    tmp.ray.origin = { x: target.x, y: target.y, z: target.z }
    tmp.ray.dir = { x: dir.x, y: dir.y, z: dir.z }
    const hit = world.castRay(tmp.ray, s.camDist + 0.3, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, rb)
    const dist = hit ? Math.max(0.6, hit.timeOfImpact - 0.3) : s.camDist
    if (hit && dist < s.camDist) s.camDist = Math.max(dist, CAMERA.minDistance * 0.4)
    camera.position.copy(target).addScaledVector(dir, Math.min(dist, s.camDist))
    if (camera.position.y < 0.3) camera.position.y = 0.3
    camera.lookAt(target)
  }

  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[spawn.feet[0], spawn.feet[1] + CENTER_HEIGHT + 0.05, spawn.feet[2]]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider ref={collider} args={[CAPSULE_HALF, CAPSULE_RADIUS]} />
      </RigidBody>
      <group ref={visual} position={[spawn.feet[0], spawn.feet[1], spawn.feet[2]]} rotation-y={spawn.yaw}>
        <Avatar ref={avatar} />
      </group>
    </>
  )
}
