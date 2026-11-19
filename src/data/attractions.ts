import type { RideKind, RideStatus } from '@/core/rides/types'
import { ZONE_RING } from '@/config/park'

export type AttractionId =
  | 'predictor'
  | 'vortex'
  | 'mind-labyrinth'
  | 'skyfall'
  | 'laser-dimension'
  | 'titan-swing'
  | 'cyber-vision'
  | 'tsunami-x'

export interface AttractionDef {
  id: AttractionId
  name: string
  project: string // project slug
  kind: RideKind
  kindLabel: string
  status: RideStatus
  /** Theme colour (signage, lights, plot accents). */
  color: string
  /** Placement on the ring around the central plaza (degrees, 0 = north, clockwise). */
  angle: number
  /** Distance from the plaza centre. */
  distance: number
  /** Radius of the reserved plot. Rides must fit inside it. */
  radius: number
  /** Approximate max height, used for the reserved-plot hologram. */
  height: number
}

export const ATTRACTIONS: AttractionDef[] = [
  {
    id: 'titan-swing',
    name: 'THE TITAN SWING',
    project: 'competencia',
    kind: 'swing-boat',
    kindLabel: 'Bateau à bascule géant',
    status: 'open',
    color: '#f59e0b',
    angle: -150,
    distance: ZONE_RING,
    radius: 26,
    height: 24,
  },
  {
    id: 'mind-labyrinth',
    name: 'THE MIND LABYRINTH',
    project: 'corrige-tes-cours',
    kind: 'dark-ride',
    kindLabel: 'Parcours immersif interactif',
    status: 'open',
    color: '#a855f7',
    angle: -107,
    distance: ZONE_RING,
    radius: 30,
    height: 16,
  },
  {
    id: 'vortex',
    name: 'THE VORTEX',
    project: 'swipe',
    kind: 'pendulum',
    kindLabel: 'Pendule géant à plateforme rotative',
    status: 'open',
    color: '#ec4899',
    angle: -64,
    distance: ZONE_RING,
    radius: 28,
    height: 34,
  },
  {
    id: 'predictor',
    name: 'THE PREDICTOR',
    project: 'smartgamble',
    kind: 'coaster',
    kindLabel: 'Montagnes russes extrêmes',
    status: 'open',
    color: '#ef4444',
    angle: -21,
    distance: ZONE_RING + 18,
    radius: 42,
    height: 45,
  },
  {
    id: 'skyfall',
    name: 'SKYFALL 3000',
    project: 'healthiai',
    kind: 'drop-tower',
    kindLabel: 'Tour de chute libre géante',
    status: 'open',
    color: '#22c55e',
    angle: 21,
    distance: ZONE_RING,
    radius: 22,
    height: 70,
  },
  {
    id: 'laser-dimension',
    name: 'LASER DIMENSION',
    project: 'mindora',
    kind: 'laser-ride',
    kindLabel: 'Parcours immersif futuriste',
    status: 'open',
    color: '#06b6d4',
    angle: 64,
    distance: ZONE_RING,
    radius: 30,
    height: 16,
  },
  {
    id: 'cyber-vision',
    name: 'CYBER VISION',
    project: 'spectre',
    kind: 'flying-coaster',
    kindLabel: 'Montagnes russes volantes',
    status: 'construction',
    color: '#3b82f6',
    angle: 107,
    distance: ZONE_RING,
    radius: 32,
    height: 38,
  },
  {
    id: 'tsunami-x',
    name: 'TSUNAMI X',
    project: 'aquabot',
    kind: 'water-ride',
    kindLabel: 'Parcours aquatique extrême',
    status: 'construction',
    color: '#0ea5e9',
    angle: 150,
    distance: ZONE_RING,
    radius: 30,
    height: 30,
  },
]

export const getAttraction = (id: AttractionId) => ATTRACTIONS.find((a) => a.id === id)!

/** World position of a zone centre on the ground plane. */
export function zonePosition(a: Pick<AttractionDef, 'angle' | 'distance'>): [number, number, number] {
  const r = (a.angle * Math.PI) / 180
  return [Math.sin(r) * a.distance, 0, -Math.cos(r) * a.distance]
}

/** Y rotation that makes the zone's local +Z axis face the central plaza. */
export function zoneRotationY(a: Pick<AttractionDef, 'angle'>) {
  return -(a.angle * Math.PI) / 180
}
