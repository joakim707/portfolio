import { useMemo, useRef } from 'react'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS } from '@/core/rides/types'
import { useRideSound } from '@/core/audio/useRideSound'
import { CoasterTrain } from '@/attractions/_shared/coaster/CoasterTrain'
import { TrackMesh } from '@/attractions/_shared/coaster/TrackMesh'
import { useKenney } from '@/world/assets'
import { CAR_SPACING, CARS, GAUGE, KENNEY_SCALE, PREDICTOR_CONFIG, SEATS, STATION_S, buildPredictorTrack } from './layout'
import { Station } from './Station'
import { Tunnel } from './Tunnel'

/**
 * THE PREDICTOR — SmartGamble.
 * Extreme coaster: chain lift (~40 m), 68° first drop, two vertical loops,
 * an overbanked turn, a corkscrew and a light tunnel, with a 5-car train.
 */
export default function Predictor({ id }: { id: AttractionId }) {
  const track = useMemo(buildPredictorTrack, [])
  const trainRef = useRef<CoasterTrain | null>(null)
  const train = () => trainRef.current
  useRideSound(id, (state) => {
    const t = train()
    if (!t) return null
    return {
      speed: state === 'RUNNING' || state === 'BRAKING' ? t.getSpeed() : 0,
      lifting: state === 'RUNNING' && t.chainEngaged,
      braking: state === 'BRAKING' || (state === 'RUNNING' && t.trackLabel === 'brake'),
    }
  })
  const frontCar = useKenney('coaster-train-front')
  const car = useKenney('coaster-train')

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
          body: { front: frontCar, car, scale: KENNEY_SCALE, seats: SEATS },
          liftSpeed: 4,
          launchSpeed: 3,
          brakeSpeed: 4.5,
          minInversionSpeed: 6,
        }))
      }
    >
      <TrackMesh track={track} spineColor="#ef4444" supportColor="#1f2937" supportEvery={5} gauge={GAUGE} />
      <Station />
      <Tunnel track={track} train={train} />
    </Ride>
  )
}
