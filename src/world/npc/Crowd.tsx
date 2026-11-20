import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import { QUALITY_PRESETS, useGameStore } from '@/core/store/useGameStore'
import { createRng } from '@/utils/random'
import { SIT_HIP } from '@/world/player/characters'
import { buildNavigation, type QueueLine } from './navigation'
import { createNpc, useNpcCharacters, type NpcModel } from './characterPool'

type Mode = 'walk' | 'toSeat' | 'sit' | 'leaveSeat' | 'queue' | 'enter'

interface Agent {
  npc: NpcModel
  pos: Vector3
  yaw: number
  /** Node we come from / are heading to. */
  from: number
  to: number
  /** Lateral offset from the path centre line, so walkers do not all overlap. */
  lane: number
  speed: number
  mode: Mode
  timer: number
  seat: number
  queue: QueueLine | null
  slot: number
}

const ANIMATE_WITHIN = 90
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Park visitors (NPCs): they wander along the paths, sit on benches for a
 * while and queue in front of attractions before "entering" them. Pure
 * kinematics on the navigation graph (no physics); animations only update
 * near the camera. Count follows the graphics quality.
 */
export function Crowd() {
  const quality = useGameStore((s) => s.quality)
  const count = QUALITY_PRESETS[quality].npcs
  const sources = useNpcCharacters(quality === 'low' ? 4 : 8)
  const nav = useMemo(buildNavigation, [])

  const { group, agents } = useMemo(() => {
    const rng = createRng(1234)
    const group = new Group()
    const walkable = nav.nodes.map((_, i) => i).filter((i) => !nav.nodes[i].queue)
    const agents: Agent[] = []
    for (let i = 0; i < count; i++) {
      const npc = createNpc(sources[i % sources.length])
      const from = walkable[Math.floor(rng() * walkable.length)]
      const links = nav.nodes[from].links
      const a: Agent = {
        npc,
        pos: nav.nodes[from].p.clone(),
        yaw: rng() * Math.PI * 2,
        from,
        to: links[Math.floor(rng() * links.length)] ?? from,
        lane: (rng() - 0.5) * 2.4,
        speed: 1.9 + rng() * 0.7,
        mode: 'walk',
        timer: 0,
        seat: -1,
        queue: null,
        slot: -1,
      }
      npc.root.position.copy(a.pos)
      npc.play('walk')
      agents.push(a)
    }
    return { group, agents }
  }, [count, sources, nav])

  // shared occupancy: bench seats and queue slots
  const state = useMemo(() => {
    const st = { seats: new Set<number>(), lines: new Map<string, (Agent | null)[]>(), rng: createRng(99) }
    // the park opens already lively: a few visitors queuing at each open ride, some on benches
    let k = 0
    // ~18 % of the crowd starts in the queues (1 per line on low, 3 on high)
    const perLine = Math.max(1, Math.round((agents.length * 0.18) / Math.max(1, nav.queues.length)))
    for (const q of nav.queues) {
      const line = q.slots.map(() => null as Agent | null)
      st.lines.set(q.id, line)
      for (let s = 0; s < perLine && k < agents.length; s++, k++) {
        const a = agents[k]
        line[s] = a
        Object.assign(a, { mode: 'queue', queue: q, slot: s, timer: 6 + s * 5 })
        a.pos.copy(q.slots[s])
      }
    }
    const benchCount = Math.floor(agents.length * 0.2)
    for (let b = 0; b < benchCount && k < agents.length; b++, k++) {
      const seat = Math.floor(st.rng() * nav.seats.length)
      if (st.seats.has(seat)) continue
      st.seats.add(seat)
      const s = nav.seats[seat]
      // remember the bench's access node so the visitor walks off along the path afterwards
      const node = nav.nodes.findIndex((n) => n.benches?.includes(seat))
      Object.assign(agents[k], { mode: 'sit', seat, timer: 4 + st.rng() * 20, yaw: s.yaw, to: node, from: node })
      agents[k].pos.copy(s.p).setY(s.p.y - SIT_HIP)
    }
    return st
  }, [agents, nav])

  // attach in the effect (not in useMemo), symmetric with the cleanup: React's
  // dev double mount (mount → cleanup → mount) must not leave the group empty
  useEffect(() => {
    for (const a of agents) group.add(a.npc.root)
    return () => {
      for (const a of agents) group.remove(a.npc.root)
    }
  }, [group, agents])

  const tmp = useMemo(() => ({ target: new Vector3(), dir: new Vector3() }), [])

  if (import.meta.env.DEV) (window as unknown as { __crowd?: Agent[] }).__crowd = agents

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    if (useGameStore.getState().phase === 'paused') return
    const rng = state.rng
    const line = (q: QueueLine) => {
      let l = state.lines.get(q.id)
      if (!l) state.lines.set(q.id, (l = q.slots.map(() => null)))
      return l
    }

    for (const a of agents) {
      const node = nav.nodes[a.to]
      let target: Vector3 | null = null
      let moving = true

      switch (a.mode) {
        case 'walk': {
          // aim at the next node, shifted sideways onto this agent's lane
          tmp.dir.subVectors(node.p, nav.nodes[a.from].p).setY(0)
          const len = tmp.dir.length()
          if (len > 1e-3) tmp.dir.divideScalar(len)
          target = tmp.target.set(node.p.x - tmp.dir.z * a.lane, 0, node.p.z + tmp.dir.x * a.lane)
          if (a.pos.distanceTo(target) < 0.4) {
            // arrived: decide what to do at this node
            const q = node.queue ? nav.queues.find((l) => l.id === node.queue) : null
            const freeSeat = node.benches?.find((s) => !state.seats.has(s))
            if (q && rng() < 0.75) {
              const l = line(q)
              const k = l.indexOf(null)
              if (k >= 0 && l.slice(k).every((x) => x === null)) {
                l[k] = a
                a.mode = 'queue'
                a.queue = q
                a.slot = k
                a.timer = 10 + rng() * 6
                break
              }
            }
            if (freeSeat !== undefined && rng() < 0.35) {
              state.seats.add(freeSeat)
              a.seat = freeSeat
              a.mode = 'toSeat'
              break
            }
            const options = node.links.filter((l) => l !== a.from)
            const pool = options.length ? options : node.links
            // visitors favour the heart of the park (plaza, promenade, start of the avenue)
            let next = pool[Math.floor(rng() * pool.length)]
            for (let tries = 0; tries < 2 && nav.nodes[next].p.length() > 90 && rng() < 0.7; tries++) next = pool[Math.floor(rng() * pool.length)]
            a.from = a.to
            a.to = next ?? a.to
          }
          break
        }
        case 'toSeat': {
          const s = nav.seats[a.seat]
          target = s.approach
          if (a.pos.distanceTo(target) < 0.3) {
            a.mode = 'sit'
            a.timer = 10 + rng() * 15
            a.pos.copy(s.p).setY(s.p.y - SIT_HIP)
            a.yaw = s.yaw
          }
          break
        }
        case 'sit': {
          moving = false
          a.timer -= dt
          if (a.timer <= 0) {
            const s = nav.seats[a.seat]
            a.pos.copy(s.approach)
            state.seats.delete(a.seat)
            a.seat = -1
            a.mode = 'leaveSeat'
          }
          break
        }
        case 'leaveSeat': {
          target = node.p
          if (a.pos.distanceTo(target) < 0.4) a.mode = 'walk'
          break
        }
        case 'queue': {
          const q = a.queue!
          const l = line(q)
          // shuffle forward whenever the slot ahead frees up
          if (a.slot > 0 && l[a.slot - 1] === null) {
            l[a.slot] = null
            a.slot -= 1
            l[a.slot] = a
          }
          target = q.slots[a.slot]
          if (a.pos.distanceTo(target) < 0.15) {
            moving = false
            a.yaw = q.yaw
            if (a.slot === 0) {
              a.timer -= dt
              if (a.timer <= 0) {
                l[0] = null
                a.mode = 'enter'
              }
            }
          }
          break
        }
        case 'enter': {
          const q = a.queue!
          target = q.entry
          if (a.pos.distanceTo(target) < 0.4) {
            // "went into the ride": come back elsewhere in the park, away from the camera
            const far = nav.nodes.map((_, i) => i).filter((i) => !nav.nodes[i].queue && nav.nodes[i].p.distanceTo(camera.position) > 40)
            const n = far[Math.floor(rng() * far.length)] ?? 0
            a.pos.copy(nav.nodes[n].p)
            a.from = n
            a.to = nav.nodes[n].links[0] ?? n
            a.queue = null
            a.slot = -1
            a.mode = 'walk'
          }
          break
        }
      }

      if (target && moving) {
        tmp.dir.subVectors(target, a.pos).setY(0)
        const d = tmp.dir.length()
        const step = Math.min(d, a.speed * dt)
        if (d > 1e-4) {
          a.pos.addScaledVector(tmp.dir, step / d)
          const want = Math.atan2(-tmp.dir.x, -tmp.dir.z)
          a.yaw += wrap(want - a.yaw) * Math.min(1, dt * 8)
        }
        if (a.mode !== 'sit') a.pos.y = 0
      }

      const root = a.npc.root
      root.position.copy(a.pos)
      root.rotation.y = a.yaw
      const clip = a.mode === 'sit' ? 'sit' : moving && target ? 'walk' : 'idle'
      a.npc.play(clip, clip === 'walk' ? Math.max(0.45, a.speed / 4.2) : 1)
      if (root.position.distanceToSquared(camera.position) < ANIMATE_WITHIN * ANIMATE_WITHIN) a.npc.mixer.update(dt)
    }
  })

  return <primitive object={group} />
}
