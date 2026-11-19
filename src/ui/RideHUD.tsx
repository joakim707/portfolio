import { useEffect, useRef, useState } from 'react'
import { getAttraction } from '@/data/attractions'
import { getProject } from '@/data/projects'
import { registerFader } from '@/core/rides/runtime'
import type { CameraMode, RideState } from '@/core/rides/types'
import { useGameStore } from '@/core/store/useGameStore'
import { activeRide, CAMERA_MODES, resumeWithPointerLock } from './useGameInput'
import { panel } from './styles'

const STATE_LABEL: Partial<Record<RideState, string>> = {
  BOARDING: 'Embarquement…',
  RESTRAINTS: 'Fermeture des harnais',
  STARTING: 'Départ imminent',
  RUNNING: 'En route !',
  BRAKING: 'Freinage',
  UNBOARDING: 'Débarquement',
  INTERRUPTED: 'Arrêt demandé — retour en gare',
}
const CAMERA_LABEL: Record<CameraMode, string> = { pov: 'Subjective', chase: 'Extérieure', cinematic: 'Cinématique' }

/** Full-screen black layer driven imperatively by the ride runtime (no re-render per frame). */
export function Fader() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    registerFader(ref.current)
    return () => registerFader(null)
  }, [])
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-20 bg-black" style={{ opacity: 0 }} aria-hidden />
}

/** Seconds left before departure, sampled a few times per second. */
function useCountdown(active: boolean) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (!active) return setLeft(null)
    const id = window.setInterval(() => {
      const r = activeRide()
      setLeft(r && r.state === 'STARTING' ? Math.max(0, Math.ceil(r.timings.starting - r.sm.stateTime)) : null)
    }, 100)
    return () => window.clearInterval(id)
  }, [active])
  return left
}

export function RideHUD() {
  const ride = useGameStore((s) => s.activeRide)
  const phase = useGameStore((s) => s.phase)
  const mode = useGameStore((s) => s.rideCamera)
  const setMode = useGameStore((s) => s.setRideCamera)
  const countdown = useCountdown(ride?.state === 'STARTING')
  if (!ride || phase !== 'riding' || ride.state === 'COMPLETED') return null
  const a = getAttraction(ride.id)
  const onboard = ride.state !== 'BOARDING' && ride.state !== 'UNBOARDING'

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-between p-4 text-white">
      <div className={`${panel} px-5 py-2.5 text-center`}>
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: a.color }}>
          {a.name}
        </p>
        <p className="mt-0.5 text-sm font-semibold">
          {STATE_LABEL[ride.state]}
          {countdown !== null && countdown > 0 && <span className="ml-2 font-display text-gold">{countdown}</span>}
        </p>
      </div>

      {onboard && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
          <div className={`${panel} flex p-1`} role="group" aria-label="Vue embarquée">
            {CAMERA_MODES.map((m, i) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === m ? 'bg-gold text-night' : 'text-white/75 hover:text-white'}`}
              >
                <span className="mr-1 opacity-60">{i + 1}</span>
                {CAMERA_LABEL[m]}
              </button>
            ))}
          </div>
          {ride.state !== 'INTERRUPTED' && (
            <button
              onClick={() => activeRide()?.requestInterrupt()}
              className={`${panel} px-3 py-2 text-xs font-semibold hover:bg-brand`}
            >
              Quitter l'attraction <span className="opacity-60">(X)</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** End-of-ride panel: the project behind the attraction. Only provided facts are shown. */
export function CompletedPanel() {
  const ride = useGameStore((s) => s.activeRide)
  const phase = useGameStore((s) => s.phase)
  const [details, setDetails] = useState(false)
  useEffect(() => setDetails(false), [ride?.id])
  if (!ride || ride.state !== 'COMPLETED' || ride.interrupted || phase !== 'riding') return null
  const a = getAttraction(ride.id)
  const p = getProject(a.project)
  const close = (replay: boolean) => {
    const rt = activeRide()
    rt?.acknowledge(replay)
    if (!replay) resumeWithPointerLock()
  }
  const hasContent = !!(p?.description || p?.tagline || p?.features.length)

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-night/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fin du trajet">
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-night/95 p-6 text-white shadow-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-gold uppercase">Trajet terminé · tampon ajouté au passeport</p>
        <h2 className="font-display mt-2 text-2xl" style={{ color: a.color }}>
          {a.name}
        </h2>
        <div className="mt-5 rounded-xl bg-white/5 p-4">
          <p className="text-xs tracking-widest text-white/50 uppercase">Le projet derrière l'attraction</p>
          <p className="mt-1 text-xl font-semibold">{p?.title ?? a.project}</p>
          {p?.context && <p className="text-xs text-white/50">{p.context}</p>}
          {hasContent ? (
            <p className="mt-2 text-sm leading-relaxed text-white/80">{details ? p?.description ?? p?.tagline : p?.tagline ?? p?.description}</p>
          ) : (
            <p className="mt-2 text-sm text-white/60 italic">Fiche projet à compléter.</p>
          )}
          {!!p?.stack.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((t) => (
                <span key={t} className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
          {details && p && (
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
              {p.problem && (
                <section>
                  <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase">Problème</h3>
                  <p>{p.problem}</p>
                </section>
              )}
              {!!p.features.length && (
                <section>
                  <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase">Fonctionnalités</h3>
                  <ul className="list-disc pl-5">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </section>
              )}
              {p.challenges && (
                <section>
                  <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase">Difficultés techniques</h3>
                  <p>{p.challenges}</p>
                </section>
              )}
              {p.solutions && (
                <section>
                  <h3 className="text-xs font-semibold tracking-widest text-white/50 uppercase">Solutions</h3>
                  <p>{p.solutions}</p>
                </section>
              )}
              {(p.github || p.demo) && (
                <div className="flex gap-2">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
                      GitHub
                    </a>
                  )}
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
                      Démo
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {hasContent && (
            <button onClick={() => setDetails((d) => !d)} className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15">
              {details ? 'Réduire la fiche' : 'Découvrir le projet'}
            </button>
          )}
          <button onClick={() => close(true)} className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15">
            Refaire un tour
          </button>
          <button onClick={() => close(false)} className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold hover:brightness-110">
            Continuer la visite
          </button>
        </div>
      </div>
    </div>
  )
}
