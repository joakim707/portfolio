import { useProgress } from '@react-three/drei'
import { useGameStore } from '@/core/store/useGameStore'

export function LoadingScreen() {
  const phase = useGameStore((s) => s.phase)
  const { progress, active } = useProgress()
  const visible = phase === 'loading'

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-night text-white transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <p className="mb-3 text-xs font-semibold tracking-[0.4em] text-gold uppercase">Bienvenue à</p>
      <h1 className="font-display text-4xl sm:text-6xl">WILONDJA WORLD</h1>
      <p className="mt-3 text-sm text-white/70">Where Code Meets Imagination.</p>
      <div className="mt-10 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-brand transition-[width] duration-300 ${active ? '' : 'animate-pulse'}`}
          style={{ width: `${active ? Math.max(8, progress) : 100}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-white/50">Ouverture des portes…</p>
    </div>
  )
}
