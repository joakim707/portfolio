import { ATTRACTIONS } from '@/data/attractions'
import { Terrain } from './Terrain'
import { Paths } from './Paths'
import { CentralPlaza } from './CentralPlaza'
import { Entrance } from './Entrance'
import { Vegetation } from './Vegetation'
import { Lamps } from './Lamps'
import { AttractionZone } from './AttractionZone'
import { Stands } from './Stands'
import { Pond } from './Pond'
import { Decor } from './Decor'
import { Forecourt } from './Forecourt'

/** The whole static park. Must be rendered inside <Physics>. */
export function Park() {
  return (
    <group name="park">
      <Terrain />
      <Paths />
      <CentralPlaza />
      <Entrance />
      <Forecourt />
      <Stands />
      <Pond />
      <Decor />
      <Lamps />
      <Vegetation />
      {ATTRACTIONS.map((a) => (
        <AttractionZone key={a.id} def={a} />
      ))}
    </group>
  )
}
