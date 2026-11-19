import { useEffect } from 'react'
import { useGameStore } from '@/core/store/useGameStore'
import { rideRuntimes } from '@/core/rides/runtime'
import type { CameraMode } from '@/core/rides/types'

export const CAMERA_MODES: CameraMode[] = ['pov', 'chase', 'cinematic']

export function activeRide() {
  const a = useGameStore.getState().activeRide
  return a ? rideRuntimes.get(a.id) : undefined
}

/** Board the attraction the visitor is standing at, if it is open and ready. */
export function tryBoard() {
  const s = useGameStore.getState()
  if (s.phase !== 'explore' || !s.nearZone) return false
  return rideRuntimes.get(s.nearZone)?.requestBoard() ?? false
}

export function cycleRideCamera() {
  const s = useGameStore.getState()
  s.setRideCamera(CAMERA_MODES[(CAMERA_MODES.indexOf(s.rideCamera) + 1) % CAMERA_MODES.length])
}

/**
 * Global (DOM-level) game keys and pointer-lock bookkeeping:
 * - Échap: pause / resume (also while riding — the ride freezes).
 *   When the mouse is captured the browser consumes Échap to release it,
 *   so losing the lock during play also pauses.
 * - M (by character, so it works on AZERTY and QWERTY): park map / teleport.
 * - E: board · C / 1 2 3: on-board camera · X: leave the ride now.
 */
export function useGameInput() {
  useEffect(() => {
    let lockLostAt = 0

    const onLockChange = () => {
      const locked = !!document.pointerLockElement
      const s = useGameStore.getState()
      s.setPointerLocked(locked)
      if (!locked) {
        lockLostAt = performance.now()
        const ride = s.activeRide
        // releasing the mouse for the end-of-ride panel is not a pause
        const onPanel = ride && (ride.state === 'COMPLETED' || ride.state === 'UNBOARDING')
        if ((s.phase === 'explore' || s.phase === 'riding') && !onPanel) s.openMenu('main')
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const s = useGameStore.getState()
      if (e.code === 'Escape') {
        if (performance.now() - lockLostAt < 300) return // this Échap already released the mouse
        if (s.phase === 'explore' || s.phase === 'riding') s.openMenu('main')
        else if (s.phase === 'paused') resumeWithPointerLock()
        else if (s.phase === 'intro') s.setPhase('explore')
        return
      }
      if (s.phase === 'riding') {
        if (e.code === 'KeyC') cycleRideCamera()
        else if (e.code === 'Digit1' || e.code === 'Numpad1') s.setRideCamera('pov')
        else if (e.code === 'Digit2' || e.code === 'Numpad2') s.setRideCamera('chase')
        else if (e.code === 'Digit3' || e.code === 'Numpad3') s.setRideCamera('cinematic')
        else if (e.code === 'KeyX') activeRide()?.requestInterrupt()
        return
      }
      if (e.code === 'KeyE') {
        tryBoard()
      } else if (e.key.toLowerCase() === 'm') {
        if (s.phase === 'explore') {
          s.openMenu('map')
          document.exitPointerLock?.()
        } else if (s.phase === 'paused' && s.menuTab === 'map') resumeWithPointerLock()
      }
    }

    document.addEventListener('pointerlockchange', onLockChange)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}

/** Resume from a click (user gesture), recapturing the mouse when possible. */
export function resumeWithPointerLock() {
  useGameStore.getState().resume()
  const canvas = document.querySelector('canvas')
  if (canvas && matchMedia('(pointer: fine)').matches) {
    try {
      Promise.resolve(canvas.requestPointerLock?.()).catch(() => {})
    } catch {
      /* the browser may refuse right after Échap; click-drag still works */
    }
  }
}
