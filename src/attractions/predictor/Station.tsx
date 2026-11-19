import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { BoxGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three'
import { MAT } from '@/world/materials'
import { useSignTexture } from '@/utils/textTexture'
import { STATION_START_X, STATION_Z } from './layout'

const X0 = STATION_START_X + 3.5 // platform west end
const X1 = STATION_START_X + 22 // platform east end
const PLATFORM_Z0 = STATION_Z + 1.0 // edge along the train
const PLATFORM_Z1 = STATION_Z + 3.6
const DECK_Y = 0.35
const ROOF_Y = 5
const ENCLOSURE_X = 13
const ENCLOSURE_Z_END = 41.4

const postGeo = new BoxGeometry(0.08, 1, 0.08).translate(0, 0.5, 0)

/** Queue rails: switchback lanes between the entrance arch and the platform. */
function QueueRails() {
  const posts = useMemo(() => {
    const out: Matrix4[] = []
    for (const z of [36, 38.2]) for (let x = -9; x <= 9; x += 1.5) out.push(new Matrix4().makeTranslation(x, 0, z))
    return out
  }, [])
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    posts.forEach((m, i) => ref.current!.setMatrixAt(i, m))
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [posts])
  return (
    <group>
      <instancedMesh ref={ref} args={[postGeo, MAT.metal, posts.length]} />
      {[36, 38.2].map((z) => (
        <mesh key={z} position={[0, 0.95, z]} material={MAT.brand}>
          <boxGeometry args={[18, 0.06, 0.06]} />
        </mesh>
      ))}
    </group>
  )
}

/** Holographic "oracle" orb on the roof — the prediction theme of the ride. */
function Oracle() {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.rotation.y = clock.elapsedTime * 0.5
    g.current.position.y = ROOF_Y + 4.2 + Math.sin(clock.elapsedTime * 1.3) * 0.25
  })
  return (
    <group ref={g} position={[STATION_START_X + 9, ROOF_Y + 4.2, STATION_Z + 1]}>
      <mesh>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color="#ef4444" wireframe toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.1, 24, 16]} />
        <meshStandardMaterial color="#1f0a0a" emissive="#ef4444" emissiveIntensity={1.4} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.3, 0.07, 8, 48]} />
        <meshBasicMaterial color="#f6c445" toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Station() {
  const sign = useSignTexture('THE PREDICTOR', 'Projet SmartGamble', { width: 2048, height: 512, background: '#12060a', accent: '#ef4444' })
  const mats = useMemo(
    () => ({
      roof: new MeshStandardMaterial({ color: '#1a1d24', roughness: 0.6, metalness: 0.3 }),
      neon: new MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.2, toneMapped: false }),
      glass: new MeshStandardMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.25, roughness: 0.1 }),
    }),
    [],
  )
  const roofW = X1 - X0 + 4
  const roofCx = (X0 + X1) / 2
  const roofZ0 = STATION_Z - 2.2
  const roofZ1 = PLATFORM_Z1 + 0.6
  const roofCz = (roofZ0 + roofZ1) / 2
  const roofD = roofZ1 - roofZ0

  return (
    <group>
      {/* platform deck */}
      <mesh position={[(X0 + X1) / 2, DECK_Y / 2, (PLATFORM_Z0 + PLATFORM_Z1) / 2]} material={MAT.concrete} castShadow receiveShadow>
        <boxGeometry args={[X1 - X0, DECK_Y, PLATFORM_Z1 - PLATFORM_Z0]} />
      </mesh>
      <mesh position={[(X0 + X1) / 2, DECK_Y + 0.005, PLATFORM_Z0 + 0.25]} rotation-x={-Math.PI / 2} material={MAT.yellow}>
        <planeGeometry args={[X1 - X0, 0.18]} />
      </mesh>
      {/* safety glass between platform and train (the avatar is animated across it) */}
      <mesh position={[(X0 + X1) / 2, DECK_Y + 0.55, PLATFORM_Z0 + 0.05]} material={mats.glass}>
        <boxGeometry args={[X1 - X0, 1.1, 0.05]} />
      </mesh>

      {/* roof on columns, with neon edges */}
      {[X0 - 1.5, (X0 + X1) / 2, X1 + 1.5].map((x) =>
        [roofZ0 + 0.3, roofZ1 - 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, ROOF_Y / 2, z]} material={MAT.darkMetal} castShadow>
            <boxGeometry args={[0.35, ROOF_Y, 0.35]} />
          </mesh>
        )),
      )}
      <mesh position={[roofCx, ROOF_Y, roofCz]} material={mats.roof} castShadow receiveShadow>
        <boxGeometry args={[roofW, 0.4, roofD]} />
      </mesh>
      <mesh position={[roofCx, ROOF_Y - 0.25, roofZ1]} material={mats.neon}>
        <boxGeometry args={[roofW, 0.1, 0.1]} />
      </mesh>
      <mesh position={[roofCx, ROOF_Y - 0.25, roofZ0]} material={mats.neon}>
        <boxGeometry args={[roofW, 0.1, 0.1]} />
      </mesh>
      {/* big sign facing the plaza */}
      <mesh position={[roofCx, ROOF_Y + 1.9, roofZ1 - 0.2]}>
        <planeGeometry args={[14, 3.5]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[roofCx, ROOF_Y + 1.9, roofZ1 - 0.3]} material={mats.roof}>
        <boxGeometry args={[14.4, 3.9, 0.15]} />
      </mesh>
      <Oracle />

      <QueueRails />
      {/* enclosure: keeps visitors in the queue area, off the track */}
      {[-ENCLOSURE_X, ENCLOSURE_X].map((x) => (
        <mesh key={x} position={[x, 0.55, (PLATFORM_Z0 + ENCLOSURE_Z_END) / 2]} material={MAT.darkMetal}>
          <boxGeometry args={[0.08, 1.1, ENCLOSURE_Z_END - PLATFORM_Z0]} />
        </mesh>
      ))}
      {[[-ENCLOSURE_X, X0], [X1, ENCLOSURE_X]].map(([a, b]) => (
        <mesh key={a} position={[(a + b) / 2, 0.55, PLATFORM_Z0]} material={MAT.darkMetal}>
          <boxGeometry args={[b - a, 1.1, 0.08]} />
        </mesh>
      ))}

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[(X1 - X0) / 2, DECK_Y / 2, (PLATFORM_Z1 - PLATFORM_Z0) / 2]} position={[(X0 + X1) / 2, DECK_Y / 2, (PLATFORM_Z0 + PLATFORM_Z1) / 2]} />
        {/* the whole track side of the queue area is closed */}
        <CuboidCollider args={[ENCLOSURE_X, 1.2, 0.15]} position={[0, 1.2, PLATFORM_Z0 - 0.1]} />
        {[-ENCLOSURE_X, ENCLOSURE_X].map((x) => (
          <CuboidCollider key={x} args={[0.15, 1.2, (ENCLOSURE_Z_END - PLATFORM_Z0) / 2]} position={[x, 1.2, (PLATFORM_Z0 + ENCLOSURE_Z_END) / 2]} />
        ))}
        {/* roof columns on the platform side */}
        {[X0 - 1.5, (X0 + X1) / 2, X1 + 1.5].map((x) => (
          <CuboidCollider key={x} args={[0.2, ROOF_Y / 2, 0.2]} position={[x, ROOF_Y / 2, roofZ1 - 0.3]} />
        ))}
      </RigidBody>
    </group>
  )
}
