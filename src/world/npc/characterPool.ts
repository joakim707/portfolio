import { useGLTF } from '@react-three/drei'
import { AnimationMixer, Group, LoopRepeat, Mesh, type AnimationClip, type Object3D } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { CHARACTER_SCALE, characterUrl } from '@/world/player/characters'

/** Visitor models used for NPCs (a varied subset keeps downloads small). */
export const NPC_CHARACTERS = ['male-b', 'female-a', 'male-e', 'female-d', 'worker', 'female-b', 'male-c', 'female-e']

export interface NpcModel {
  root: Object3D
  mixer: AnimationMixer
  play(clip: 'idle' | 'walk' | 'sit', timeScale?: number): void
}

/** Load the NPC character set (suspends once; cached by drei). */
export function useNpcCharacters(count: number) {
  return useGLTF(NPC_CHARACTERS.slice(0, Math.max(1, count)).map(characterUrl))
}

/**
 * One NPC instance: skinned clone (own skeleton), scaled, facing −Z (Kenney
 * models face +Z), with a mixer and cross-faded clips.
 */
export function createNpc(source: { scene: Object3D; animations: AnimationClip[] }): NpcModel {
  const model = cloneSkinned(source.scene)
  model.scale.setScalar(CHARACTER_SCALE)
  model.rotation.y = Math.PI
  model.traverse((o) => {
    if ((o as Mesh).isMesh) {
      o.castShadow = true
      o.frustumCulled = false
    }
  })
  const root = new Group()
  root.add(model)
  const mixer = new AnimationMixer(model)
  const actions = new Map(source.animations.map((c) => [c.name, mixer.clipAction(c)]))
  let current: string | null = null
  return {
    root,
    mixer,
    play(clip, timeScale = 1) {
      const next = actions.get(clip)
      if (!next) return
      next.timeScale = timeScale
      if (current === clip) return
      const prev = current ? actions.get(current) : null
      next.reset().setLoop(LoopRepeat, Infinity).play()
      if (prev) next.crossFadeFrom(prev, 0.25, false)
      current = clip
    },
  }
}

/**
 * Seated passenger with a frozen "sit" pose: sampled once, never updated
 * again (no per-frame cost besides drawing).
 */
export function createSeatedRider(source: { scene: Object3D; animations: AnimationClip[] }) {
  const npc = createNpc(source)
  npc.play('sit')
  npc.mixer.update(0.4)
  // do NOT stop the action: deactivating it would restore the bind pose.
  // Simply never updating the mixer again keeps the bones in the sitting pose.
  return npc.root
}
