import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS } from '@/core/rides/types'
import { useGameStore } from '@/core/store/useGameStore'
import { rideRuntimes } from '@/core/rides/runtime'
import { rideAudio } from '@/core/audio/rideAudio'
import { CoasterTrain } from '@/attractions/_shared/coaster/CoasterTrain'
import { TrackMesh } from '@/attractions/_shared/coaster/TrackMesh'
import { CAR_SPACING, CARS, PREDICTOR_CONFIG, STATION_S, buildPredictorTrack } from './layout'
import { Station } from './Station'
import { Tunnel } from './Tunnel'

/** Drives the on-board sound from the train state (only while the visitor rides this attraction). */
function useRideSound(id: AttractionId, train: () => CoasterTrain | null) {
  const lastState = useRef<string | null>(null)
  useEffect(() => () => rideAudio.setActive(false), [])
  useFrame((_, dt) => {
    const s = useGameStore.getState()
    const mine = s.activeRide?.id === id
    const t = train()
    if (!mine || !t) {
      if (lastState.current !== null) rideAudio.setActive(false)
      lastState.current = null
      return
    }
    const state = rideRuntimes.get(id)?.state ?? 'IDLE'
    if (lastState.current === null) {
      rideAudio.unlock() // boarding was a user gesture (E / click)
      rideAudio.setActive(true)
    }
    if (state === 'STARTING' && lastState.current !== 'STARTING') rideAudio.bell()
    lastState.current = state
    rideAudio.update(
      {
        speed: state === 'RUNNING' || state === 'BRAKING' ? t.getSpeed() : 0,
        onChain: state === 'RUNNING' && t.chainEngaged,
        braking: state === 'BRAKING' || (state === 'RUNNING' && t.trackLabel === 'brake'),
        level: s.phase === 'paused' ? 0 : 1,
      },
      Math.min(dt, 0.1),
    )
  })
}

/**
 * THE PREDICTOR — SmartGamble.
 * Extreme coaster: chain lift (~40 m), 68° first drop, two vertical loops,
 * an overbanked turn, a corkscrew and a light tunnel, with a 5-car train.
 */
export default function Predictor({ id }: { id: AttractionId }) {
  const track = useMemo(buildPredictorTrack, [])
  const trainRef = useRef<CoasterTrain | null>(null)
  const train = () => trainRef.current
  useRideSound(id, train)

  return (
    <Ride
      id={id}
      config={PREDICTOR_CONFIG}
      createSimulation={() =>
        (trainRef.current = new CoasterTrain({
          track,
          timings: { ...DEFAULT_TIMINGS, ...PREDICTOR_CONFIG.timings },
          stationS: STATION_S,
          cars: CARS,
          spacing: CAR_SPACING,
          playerCar: 0,
          colors: { body: '#b91c1c', trim: '#111827', bar: '#f6c445' },
          liftSpeed: 4,
          launchSpeed: 3,
          brakeSpeed: 4.5,
          minInversionSpeed: 6,
        }))
      }
    >
      <TrackMesh track={track} spineColor="#ef4444" supportColor="#1f2937" supportEvery={5} />
      <Station />
      <Tunnel track={track} train={train} />
    </Ride>
  )
}
