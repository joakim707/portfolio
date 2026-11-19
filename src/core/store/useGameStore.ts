import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AttractionId } from '@/data/attractions'
import type { CameraMode, RideState } from '@/core/rides/types'

export type GamePhase = 'loading' | 'intro' | 'explore' | 'riding' | 'paused'
export type Quality = 'low' | 'medium' | 'high'

export interface ComfortSettings {
  reduceShake: boolean
  motionBlur: boolean
  reduceCameraFx: boolean
}

export interface ActiveRide {
  id: AttractionId
  state: RideState
  /** True when the visitor left early: no project panel, no passport stamp. */
  interrupted: boolean
}

interface GameState {
  phase: GamePhase
  quality: Quality
  comfort: ComfortSettings
  /** Passport: attractions completed at least once. */
  visited: AttractionId[]
  activeRide: ActiveRide | null
  /** Attraction whose entrance the player is standing at (proximity prompt). */
  nearZone: AttractionId | null
  /** Mouse captured by the canvas (pointer lock). */
  pointerLocked: boolean
  /** Pending teleport for the player rig; nonce makes repeated requests distinct. */
  teleport: TeleportRequest | null
  /** Section shown by the pause menu. */
  menuTab: MenuTab
  /** Phase to return to when the pause menu closes. */
  pausedFrom: 'explore' | 'riding'
  /** Preferred on-board camera (persisted). */
  rideCamera: CameraMode

  setPhase: (p: GamePhase) => void
  setQuality: (q: Quality) => void
  setComfort: (c: Partial<ComfortSettings>) => void
  markVisited: (id: AttractionId) => void
  setActiveRide: (r: ActiveRide | null) => void
  setRideCamera: (m: CameraMode) => void
  setNearZone: (id: AttractionId | null) => void
  setPointerLocked: (v: boolean) => void
  requestTeleport: (target: TeleportTarget) => void
  openMenu: (tab: MenuTab) => void
  resume: () => void
}

export type MenuTab = 'main' | 'map'

export type TeleportTarget = AttractionId | 'plaza' | 'entrance'
export interface TeleportRequest {
  target: TeleportTarget
  nonce: number
}

/** Pick a sensible default quality from the device. */
function detectQuality(): Quality {
  if (typeof navigator === 'undefined') return 'medium'
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const cores = navigator.hardwareConcurrency ?? 4
  if (mobile || cores <= 4) return 'low'
  return cores >= 8 ? 'high' : 'medium'
}

/** localStorage can throw (private mode, blocked storage): fall back to memory. */
const safeStorage = createJSONStorage(() => {
  try {
    const k = '__ww_test__'
    window.localStorage.setItem(k, k)
    window.localStorage.removeItem(k)
    return window.localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
  }
})

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      phase: 'loading',
      quality: detectQuality(),
      comfort: { reduceShake: false, motionBlur: true, reduceCameraFx: false },
      visited: [],
      activeRide: null,
      nearZone: null,
      pointerLocked: false,
      teleport: null,
      menuTab: 'main',
      pausedFrom: 'explore',
      rideCamera: 'pov',

      setPhase: (phase) => set({ phase }),
      setQuality: (quality) => set({ quality }),
      setComfort: (c) => set((s) => ({ comfort: { ...s.comfort, ...c } })),
      markVisited: (id) => set((s) => (s.visited.includes(id) ? s : { visited: [...s.visited, id] })),
      setActiveRide: (activeRide) => set({ activeRide }),
      setRideCamera: (rideCamera) => set({ rideCamera }),
      setNearZone: (nearZone) => set((s) => (s.nearZone === nearZone ? s : { nearZone })),
      setPointerLocked: (pointerLocked) => set({ pointerLocked }),
      requestTeleport: (target) => set({ teleport: { target, nonce: Date.now() + Math.random() } }),
      openMenu: (menuTab) =>
        set((s) => ({
          menuTab,
          phase: 'paused',
          pausedFrom: s.phase === 'riding' ? 'riding' : s.phase === 'paused' ? s.pausedFrom : 'explore',
        })),
      resume: () => set((s) => (s.phase === 'paused' ? { phase: s.pausedFrom } : s)),
    }),
    {
      name: 'wilondja-world',
      storage: safeStorage,
      // Only preferences and progress persist; runtime state never does.
      partialize: (s) => ({ quality: s.quality, comfort: s.comfort, visited: s.visited, rideCamera: s.rideCamera }),
    },
  ),
)

export const QUALITY_PRESETS: Record<Quality, { dpr: [number, number]; shadows: boolean; shadowMapSize: number; trees: number }> = {
  low: { dpr: [0.75, 1], shadows: false, shadowMapSize: 1024, trees: 160 },
  medium: { dpr: [1, 1.5], shadows: true, shadowMapSize: 2048, trees: 320 },
  high: { dpr: [1, 2], shadows: true, shadowMapSize: 4096, trees: 520 },
}

// Dev-only handle for automated browser tests.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __store?: typeof useGameStore }).__store = useGameStore
}
