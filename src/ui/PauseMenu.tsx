import { useEffect, useState } from 'react'
import { ATTRACTIONS } from '@/data/attractions'
import { ATTRACTION_MODULES } from '@/core/rides/registry'
import { useGameStore, type ComfortSettings, type Quality, type TeleportTarget } from '@/core/store/useGameStore'
import { activeRide, resumeWithPointerLock } from './useGameInput'
import { CHARACTERS, characterPreview } from '@/world/player/characters'

const QUALITY_LABELS: Record<Quality, string> = { low: 'Bas', medium: 'Moyen', high: 'Élevé' }
const COMFORT_LABELS: Record<keyof ComfortSettings, string> = {
  reduceShake: 'Réduire les secousses',
  motionBlur: 'Flou de mouvement',
  reduceCameraFx: 'Réduire les effets de caméra',
}

function useFullscreen() {
  const [on, setOn] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const h = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }
  return { on, toggle }
}

const tabBtn = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-gold text-night' : 'text-white/70 hover:text-white'}`

export function PauseMenu() {
  const tab = useGameStore((s) => s.menuTab)
  const openMenu = useGameStore((s) => s.openMenu)
  const quality = useGameStore((s) => s.quality)
  const setQuality = useGameStore((s) => s.setQuality)
  const comfort = useGameStore((s) => s.comfort)
  const setComfort = useGameStore((s) => s.setComfort)
  const visited = useGameStore((s) => s.visited)
  const requestTeleport = useGameStore((s) => s.requestTeleport)
  const pausedFrom = useGameStore((s) => s.pausedFrom)
  const character = useGameStore((s) => s.character)
  const setCharacter = useGameStore((s) => s.setCharacter)
  const ride = useGameStore((s) => s.activeRide)
  // no teleporting out of a moving ride: leave it properly first
  const riding = pausedFrom === 'riding' && !!ride
  const fs = useFullscreen()

  const teleport = (t: TeleportTarget) => {
    requestTeleport(t)
    resumeWithPointerLock()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-night/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Pause">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-night/95 p-5 text-white shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{tab === 'map' ? 'CARTE DU PARC' : 'PAUSE'}</h2>
          {!riding && (
            <div className="flex rounded-xl bg-white/5 p-1">
              <button className={tabBtn(tab === 'main')} onClick={() => openMenu('main')}>
                Menu
              </button>
              <button className={tabBtn(tab === 'map')} onClick={() => openMenu('map')}>
                Téléportation
              </button>
            </div>
          )}
        </div>

        {tab === 'map' && !riding ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {(
              [
                ['entrance', 'Entrée du parc', '#f6c445', 'Parvis et plan du parc'],
                ['plaza', 'Place centrale', '#7dd3fc', 'Fontaine et stands'],
              ] as const
            ).map(([id, name, color, sub]) => (
              <button key={id} onClick={() => teleport(id)} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left hover:bg-white/10">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                <span>
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="block text-xs text-white/55">{sub}</span>
                </span>
              </button>
            ))}
            {ATTRACTIONS.map((a) => {
              const built = !!ATTRACTION_MODULES[a.id]
              const status = a.status === 'construction' ? 'En construction' : built ? 'Ouverte' : 'Bientôt'
              return (
                <button key={a.id} onClick={() => teleport(a.id)} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left hover:bg-white/10">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: a.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {a.name} {visited.includes(a.id) && <span className="text-gold">✓</span>}
                    </span>
                    <span className="block truncate text-xs text-white/55">{a.kindLabel}</span>
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${a.status === 'construction' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/10 text-white/70'}`}>
                    {status}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <button onClick={resumeWithPointerLock} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold hover:brightness-110">
              {riding ? 'Reprendre le trajet' : 'Reprendre la visite'}
            </button>
            {riding && ride.state !== 'COMPLETED' && ride.state !== 'UNBOARDING' && (
              <button
                onClick={() => {
                  activeRide()?.requestInterrupt()
                  resumeWithPointerLock()
                }}
                className="-mt-3 w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15"
              >
                Quitter l'attraction maintenant
              </button>
            )}

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-white/50 uppercase">Qualité graphique</h3>
              <div className="flex rounded-xl bg-white/5 p-1">
                {(Object.keys(QUALITY_LABELS) as Quality[]).map((q) => (
                  <button key={q} onClick={() => setQuality(q)} className={`${tabBtn(quality === q)} flex-1`}>
                    {QUALITY_LABELS[q]}
                  </button>
                ))}
              </div>
            </section>

            {!riding && (
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-widest text-white/50 uppercase">Ton visiteur</h3>
                <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Choix du personnage">
                  {CHARACTERS.map((c) => (
                    <button
                      key={c.id}
                      role="radio"
                      aria-checked={character === c.id}
                      title={c.label}
                      onClick={() => setCharacter(c.id)}
                      className={`aspect-square rounded-lg p-0.5 transition ${character === c.id ? 'bg-gold' : 'bg-white/5 hover:bg-white/15'}`}
                    >
                      <img src={characterPreview(c.id)} alt={c.label} className="h-full w-full" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-white/50 uppercase">Confort</h3>
              <div className="space-y-1">
                {(Object.keys(COMFORT_LABELS) as (keyof ComfortSettings)[]).map((k) => (
                  <label key={k} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5">
                    <span className="text-sm">{COMFORT_LABELS[k]}</span>
                    <input type="checkbox" className="h-4 w-4 accent-[#f6c445]" checked={comfort[k]} onChange={(e) => setComfort({ [k]: e.target.checked })} />
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-white/50 uppercase">Commandes</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white/80">
                <dt className="text-white/55">ZQSD / WASD</dt>
                <dd>Se déplacer</dd>
                <dt className="text-white/55">Souris</dt>
                <dd>Orienter la caméra (molette : zoom)</dd>
                <dt className="text-white/55">Maj</dt>
                <dd>Courir</dd>
                <dt className="text-white/55">E</dt>
                <dd>Interagir / embarquer</dd>
                <dt className="text-white/55">C · 1 2 3</dt>
                <dd>Vue embarquée (subjective, extérieure, cinématique)</dd>
                <dt className="text-white/55">X</dt>
                <dd>Quitter l'attraction</dd>
                <dt className="text-white/55">M</dt>
                <dd>Carte et téléportation</dd>
                <dt className="text-white/55">Échap</dt>
                <dd>Pause / fermer</dd>
              </dl>
            </section>

            <button onClick={fs.toggle} className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              {fs.on ? 'Quitter le plein écran' : 'Plein écran'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
