import { useEffect, useState } from 'react'
import { ATTRACTIONS, getAttraction, type AttractionId } from '@/data/attractions'
import { getProject } from '@/data/projects'
import { ATTRACTION_MODULES } from '@/core/rides/registry'
import { rideRuntimes } from '@/core/rides/runtime'
import { useGameStore } from '@/core/store/useGameStore'
import { panel } from './styles'
import { PauseMenu } from './PauseMenu'
import { CompletedPanel, Fader, RideHUD } from './RideHUD'
import { tryBoard } from './useGameInput'

/** Ride readiness, polled (the runtime lives outside React). */
function useRideReadiness(id: AttractionId | null) {
  const [r, setR] = useState<'none' | 'ready' | 'busy'>('none')
  useEffect(() => {
    if (!id) return setR('none')
    const poll = () => {
      const rt = rideRuntimes.get(id)
      setR(!rt ? 'none' : rt.canBoard() ? 'ready' : 'busy')
    }
    poll()
    const t = window.setInterval(poll, 250)
    return () => window.clearInterval(t)
  }, [id])
  return r
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-white/25 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-white">
      {children}
    </kbd>
  )
}

/** Prompt shown when the visitor stands at an attraction's entrance arch. */
function ZonePrompt() {
  const nearZone = useGameStore((s) => s.nearZone)
  const readiness = useRideReadiness(nearZone)
  if (!nearZone) return null
  const a = getAttraction(nearZone)
  const project = getProject(a.project)
  const built = !!ATTRACTION_MODULES[a.id]
  const status =
    a.status === 'construction' && !built
      ? 'Zone en construction — ouverture prochaine'
      : !built
        ? 'Embarquement bientôt disponible'
        : readiness === 'ready'
          ? null
          : readiness === 'busy'
            ? 'Le véhicule termine un tour à vide — retour en gare imminent'
            : 'Chargement de l’attraction…'
  return (
    <div className={`${panel} pointer-events-auto mx-auto w-full max-w-sm px-5 py-3 text-center`} role="status">
      <p className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: a.color }}>
        {a.kindLabel}
      </p>
      <p className="font-display mt-1 text-xl leading-tight">{a.name}</p>
      <p className="mt-1 text-xs text-white/60">Projet : {project?.title}</p>
      <p className="mt-2 text-xs text-white/80">
        {status ?? (
          <button onClick={tryBoard} className="rounded-lg px-2 py-1 hover:bg-white/10">
            <Key>E</Key> Embarquer
          </button>
        )}
      </p>
    </div>
  )
}

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const locked = useGameStore((s) => s.pointerLocked)
  const visited = useGameStore((s) => s.visited)
  const setPhase = useGameStore((s) => s.setPhase)

  if (phase === 'loading') return null

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 text-sm text-white">
        <div className="flex items-start justify-between gap-3">
          <div className={`${panel} px-4 py-2.5`}>
            <p className="font-display text-lg leading-none">WILONDJA WORLD</p>
            <p className="mt-1 text-xs text-white/60">Where Code Meets Imagination</p>
          </div>
          {phase === 'explore' && (
            <div className={`${panel} px-3 py-2 text-xs`}>
              Passeport <span className="font-semibold text-gold">{visited.length}</span>/{ATTRACTIONS.filter((a) => a.status === 'open').length}
            </div>
          )}
        </div>

        {phase === 'intro' && (
          <button
            onClick={() => setPhase('explore')}
            className={`${panel} pointer-events-auto self-center px-4 py-2 text-xs font-semibold hover:bg-night`}
          >
            Passer l'introduction <span className="text-white/50">(Échap)</span>
          </button>
        )}

        {phase === 'explore' && (
          <div className="flex flex-col gap-3">
            {!locked && (
              <p className="mx-auto hidden rounded-full bg-night/70 px-4 py-1.5 text-xs text-white/85 backdrop-blur [@media(pointer:fine)]:block">
                Cliquez dans la scène pour contrôler la caméra
              </p>
            )}
            <ZonePrompt />
            <div className={`${panel} hidden flex-wrap items-center gap-x-4 gap-y-1.5 self-end px-4 py-2.5 text-xs text-white/80 sm:flex`}>
              <span className="flex items-center gap-1">
                <Key>ZQSD</Key>/<Key>WASD</Key> Se déplacer
              </span>
              <span className="flex items-center gap-1">
                <Key>Maj</Key> Courir
              </span>
              <span className="flex items-center gap-1">
                <Key>M</Key> Carte
              </span>
              <span className="flex items-center gap-1">
                <Key>Échap</Key> Pause
              </span>
            </div>
          </div>
        )}
      </div>
      <RideHUD />
      <CompletedPanel />
      <Fader />
      {phase === 'paused' && <PauseMenu />}
    </>
  )
}
