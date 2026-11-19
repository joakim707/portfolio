import { MeshStandardMaterial, MeshBasicMaterial, DoubleSide, Color } from 'three'
import { COLORS } from '@/config/park'

/**
 * Shared materials: created once, reused everywhere (fewer shader programs,
 * fewer state changes). Never dispose these from a component.
 */
const std = (color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra })

export const MAT = {
  grass: std(COLORS.grass, { roughness: 1 }),
  grassDark: std(COLORS.grassDark, { roughness: 1 }),
  path: std(COLORS.path, { roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  pathEdge: std(COLORS.pathEdge, { roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  plaza: std(COLORS.plaza, { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  stone: std(COLORS.stone),
  stoneDark: std('#9c917c'),
  white: std('#f4f1ea'),
  wood: std('#8a5a33'),
  metal: std('#9aa3ad', { metalness: 0.7, roughness: 0.35 }),
  darkMetal: std('#2d3138', { metalness: 0.6, roughness: 0.45 }),
  gold: std(COLORS.gold, { metalness: 0.8, roughness: 0.3 }),
  brand: std(COLORS.brand),
  navy: std('#1d2b53'),
  leaves: std('#3f8f3a', { roughness: 1 }),
  leavesDark: std('#2f6e2f', { roughness: 1 }),
  trunk: std('#6b4423'),
  hedge: std('#2f7d32', { roughness: 1 }),
  water: std(COLORS.water, { metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.85 }),
  concrete: std('#b9b5ad'),
  orange: std('#f97316'),
  yellow: std('#facc15'),
  lampGlow: new MeshStandardMaterial({ color: '#fff4cc', emissive: new Color('#ffd27a'), emissiveIntensity: 1.6 }),
  bulb: new MeshStandardMaterial({ color: '#ffffff', emissive: new Color('#ffffff'), emissiveIntensity: 1.2 }),
}

/** Translucent material for "blueprint" holograms on reserved plots. */
export function hologramMaterial(color: string, opacity = 0.35) {
  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: DoubleSide,
  })
}
