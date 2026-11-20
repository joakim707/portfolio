import type { ComponentType } from 'react'
import type { AttractionId } from '@/data/attractions'

/**
 * Lazy loaders for full attractions. Each one lives in src/attractions/<id>/
 * and is code-split, so rides are developed independently and only download
 * when needed.
 *
 * The module's default export renders the whole ride (structure, vehicles,
 * boarding zone, simulation) in the zone's local frame: origin = plot centre,
 * +Z = towards the central plaza (where the queue entrance is).
 *
 * No loader yet → the zone shows a reserved plot (status "open") or a
 * construction site (status "construction").
 */
export interface AttractionModule {
  default: ComponentType<{ id: AttractionId }>
}

export const ATTRACTION_MODULES: Partial<Record<AttractionId, () => Promise<AttractionModule>>> = {
  predictor: () => import('@/attractions/predictor'),
  skyfall: () => import('@/attractions/skyfall'),
  'titan-swing': () => import('@/attractions/titan'),
}

/**
 * DEV ONLY — `?testride=<attraction-id>` mounts the generic-system test bench
 * on that plot (e.g. ?testride=skyfall). Statically removed from prod builds.
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const id = new URLSearchParams(window.location.search).get('testride') as AttractionId | null
  if (id) ATTRACTION_MODULES[id] = () => import('@/attractions/_testbench')
}
