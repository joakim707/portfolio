/** Global park layout (metres). North = -Z, the entrance is to the south (+Z). */

export const PLAZA_RADIUS = 24
export const ZONE_RING = 105
export const PROMENADE_RADIUS = 66
export const PROMENADE_WIDTH = 6
export const RADIAL_PATH_WIDTH = 6
export const PARK_RADIUS = 172
export const GROUND_SIZE = 900

export const ENTRANCE_Z = PARK_RADIUS
export const AVENUE_WIDTH = 12
/** Half-angle (degrees) of the gap in the boundary fence where the gate stands. */
export const ENTRANCE_GAP_DEG = 6

export const SPAWN_POSITION: [number, number, number] = [0, 1, ENTRANCE_Z + 18]

export const COLORS = {
  grass: '#5d9c4a',
  grassDark: '#3f7a33',
  path: '#d9c7a7',
  pathEdge: '#b49a73',
  plaza: '#e7dcc8',
  stone: '#cbbfa8',
  water: '#3fa7d6',
  gold: '#f6c445',
  brand: '#ff4d6d',
  night: '#0b1026',
}

/** Forecourt outside the gate: an enclosed arrival square where the visitor spawns. */
export const FORECOURT = { halfWidth: 24, depth: 36 } // from ENTRANCE_Z outward

/** Ornamental pond between the plaza and the northern rides. */
export const POND = { x: 0, z: -44, radius: 9 }

/** Stands sit just outside the promenade, between two radial paths, facing the promenade. */
export const STAND_RING = PROMENADE_RADIUS + 9
export const STANDS: { angle: number; kind: 'popcorn' | 'icecream' | 'churros' | 'toilets' | 'drinks' | 'candy' | 'info' }[] = [
  { angle: -165, kind: 'info' },
  { angle: -128.5, kind: 'popcorn' },
  { angle: -85.5, kind: 'drinks' },
  { angle: -42.5, kind: 'icecream' },
  { angle: 0, kind: 'toilets' },
  { angle: 42.5, kind: 'churros' },
  { angle: 85.5, kind: 'candy' },
  { angle: 128.5, kind: 'info' },
  { angle: 165, kind: 'drinks' },
]

/** Compass angle (deg, 0 = north/-Z, clockwise) → XZ position. */
export const polar = (angleDeg: number, r: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180
  return [Math.sin(a) * r, -Math.cos(a) * r]
}
