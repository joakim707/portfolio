import { Vector3 } from 'three'
import { ATTRACTIONS, getAttraction, zonePosition } from '@/data/attractions'
import { PLAZA_RADIUS, SPAWN_POSITION } from '@/config/park'
import type { TeleportTarget } from '@/core/store/useGameStore'

/** Capsule dimensions (Rapier: half-height of the cylinder part + radius). */
export const CAPSULE_HALF = 0.55
export const CAPSULE_RADIUS = 0.35
/** Height of the capsule centre above the feet. */
export const CENTER_HEIGHT = CAPSULE_HALF + CAPSULE_RADIUS

export const WALK_SPEED = 5
export const RUN_SPEED = 10
export const GRAVITY = 25

export const CAMERA = {
  /** Look-at point above the capsule centre (around the shoulders). */
  targetHeight: 0.75,
  distance: 6,
  minDistance: 2.5,
  maxDistance: 14,
  pitch: 0.28,
  minPitch: -0.35,
  maxPitch: 1.15,
  sensitivity: 0.0024,
}

/**
 * Yaw convention: yaw = 0 → the player faces -Z (north).
 * Forward = (-sin yaw, 0, -cos yaw); the camera sits behind at +(sin yaw, ·, cos yaw).
 */
export const yawFromDirection = (dx: number, dz: number) => Math.atan2(-dx, -dz)

/** Camera offset direction for a given yaw/pitch (unit vector from target to camera). */
export function cameraDirection(yaw: number, pitch: number, out = new Vector3()) {
  return out.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
}

/** World pose of the follow camera, used by the intro to land exactly where the rig starts. */
export function followCameraPose(feet: readonly number[], yaw: number, pitch = CAMERA.pitch, dist = CAMERA.distance) {
  const target = new Vector3(feet[0], feet[1] + CENTER_HEIGHT + CAMERA.targetHeight, feet[2])
  const pos = target.clone().addScaledVector(cameraDirection(yaw, pitch), dist)
  return { pos, target }
}

/** Where the zone's queue entrance arch stands (world XZ) and the outward unit vector. */
export function zoneEntrance(a: (typeof ATTRACTIONS)[number]) {
  const [x, , z] = zonePosition(a)
  const len = Math.hypot(x, z)
  const ux = x / len
  const uz = z / len
  return { x: x - ux * a.radius, z: z - uz * a.radius, ux, uz }
}

/** Feet position + facing yaw for a teleport target. */
export function teleportPose(target: TeleportTarget): { feet: [number, number, number]; yaw: number } {
  if (target === 'entrance') return { feet: [SPAWN_POSITION[0], 0, SPAWN_POSITION[2]], yaw: 0 }
  if (target === 'plaza') return { feet: [0, 0, PLAZA_RADIUS + 3], yaw: 0 }
  const e = zoneEntrance(getAttraction(target))
  // stand on the path, 7 m in front of the arch, facing the attraction
  return { feet: [e.x - e.ux * 7, 0, e.z - e.uz * 7], yaw: yawFromDirection(e.ux, e.uz) }
}
