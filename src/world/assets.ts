import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, BufferGeometry, Mesh, MeshStandardMaterial, Vector3, type Material } from 'three'

/**
 * Kenney "Coaster Kit" (CC0 — kenney.nl). Models share one 512² colour-map
 * texture, so they all render with a single material: ideal for instancing.
 * Files live in public/models/kenney/ (see License.txt there).
 */
export const KENNEY_MODELS = [
  'tree',
  'tree-large',
  'bench',
  'trash',
  'stall-drinks',
  'stall-food',
  'stall-information',
  'stall-toilets',
  'coaster-train-front',
  'coaster-train',
] as const
export type KenneyModel = (typeof KENNEY_MODELS)[number]

const url = (name: KenneyModel) => `/models/kenney/${name}.glb`

export interface KenneyMesh {
  /** Geometry with the node transforms baked in, origin at the model's base. */
  geometry: BufferGeometry
  material: Material
  /** Native size in Kenney units (1 unit = one grid tile). */
  size: Vector3
}

/**
 * Single-mesh Kenney model as {geometry, material}, ready for <instancedMesh>.
 * Suspends while loading (counted by the loading screen).
 */
export function useKenney(name: KenneyModel): KenneyMesh {
  const { scene } = useGLTF(url(name))
  return useMemo(() => {
    scene.updateMatrixWorld(true)
    let mesh: Mesh | null = null
    scene.traverse((o) => {
      if (!mesh && (o as Mesh).isMesh) mesh = o as Mesh
    })
    if (!mesh) throw new Error(`Kenney model "${name}" has no mesh`)
    const m = mesh as Mesh
    const geometry = m.geometry.clone().applyMatrix4(m.matrixWorld)
    geometry.computeBoundingBox()
    const size = new Box3().copy(geometry.boundingBox!).getSize(new Vector3())
    const material = m.material as MeshStandardMaterial
    // flat-shaded toy look: no metallic sheen
    material.metalness = 0
    material.roughness = Math.max(material.roughness, 0.7)
    return { geometry, material, size }
  }, [scene, name])
}

/** Start downloading every model as soon as the app boots. */
export function preloadKenney() {
  KENNEY_MODELS.forEach((m) => useGLTF.preload(url(m)))
}
