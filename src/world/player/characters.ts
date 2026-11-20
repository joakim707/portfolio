/**
 * Visitor models from Kenney "Mini Characters" (CC0 — kenney.nl), stored in
 * public/models/characters/ with their own colour map (different from the
 * Coaster Kit one, hence the separate folder). Each is skinned (7 bones) and
 * ships 33 clips; we use idle / walk / sprint / fall / sit.
 */
export const CHARACTERS: { id: string; label: string }[] = [
  { id: 'male-a', label: 'Visiteur 1' },
  { id: 'male-b', label: 'Visiteur 2' },
  { id: 'male-c', label: 'Visiteur 3' },
  { id: 'male-d', label: 'Visiteur 4' },
  { id: 'male-e', label: 'Visiteur 5' },
  { id: 'male-f', label: 'Visiteur 6' },
  { id: 'male-g', label: 'Visiteur 7' },
  { id: 'female-a', label: 'Visiteuse 1' },
  { id: 'female-b', label: 'Visiteuse 2' },
  { id: 'female-c', label: 'Visiteuse 3' },
  { id: 'female-d', label: 'Visiteuse 4' },
  { id: 'female-e', label: 'Visiteuse 5' },
  { id: 'female-f', label: 'Visiteuse 6' },
  { id: 'worker', label: 'Ouvrier' },
  { id: 'robot', label: 'Robot' },
  { id: 'alien', label: 'Alien' },
]

export const characterUrl = (id: string) =>
  `/models/characters/character-${CHARACTERS.some((c) => c.id === id) ? id : 'male-a'}.glb`
export const characterPreview = (id: string) => `/models/characters/previews/character-${id}.png`

/**
 * Measured on a 0.1-unit grid (character-male-a): standing height 0.683,
 * hips 0.176; in the "sit" clip the hips sit 0.026 above the origin.
 * ×2.49 → a 1.70 m visitor.
 */
export const CHARACTER_SCALE = 2.49
export const SIT_HIP = 0.026 * CHARACTER_SCALE
