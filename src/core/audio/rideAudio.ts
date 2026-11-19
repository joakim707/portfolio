/**
 * Procedural on-board ride audio (Web Audio, no sound files):
 * chain-lift clicks, wind and wheel rumble driven by speed, brake hiss and a
 * departure bell. The AudioContext is created lazily on a user gesture
 * (boarding with E / a click), as browsers require.
 */
export interface RideAudioFrame {
  speed: number
  onChain: boolean
  braking: boolean
  /** Master level 0..1 (0 when paused / muted). */
  level: number
}

class RideAudio {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private wind!: GainNode
  private windFilter!: BiquadFilterNode
  private rumble!: GainNode
  private hiss!: GainNode
  private noise!: AudioBuffer
  private clickTimer = 0
  private active = false

  /** Must be called from a user gesture the first time. */
  unlock() {
    if (this.ctx) {
      void this.ctx.resume()
      return
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    // shared 2 s white-noise buffer
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = this.noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

    const loop = (filter: BiquadFilterNode, gain: GainNode) => {
      const src = ctx.createBufferSource()
      src.buffer = this.noise
      src.loop = true
      src.connect(filter).connect(gain).connect(this.master)
      src.start()
    }
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'lowpass'
    this.wind = ctx.createGain()
    this.wind.gain.value = 0
    loop(this.windFilter, this.wind)

    const rumbleFilter = ctx.createBiquadFilter()
    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.value = 140
    this.rumble = ctx.createGain()
    this.rumble.gain.value = 0
    loop(rumbleFilter, this.rumble)

    const hissFilter = ctx.createBiquadFilter()
    hissFilter.type = 'highpass'
    hissFilter.frequency.value = 2500
    this.hiss = ctx.createGain()
    this.hiss.gain.value = 0
    loop(hissFilter, this.hiss)
  }

  setActive(on: boolean) {
    if (on === this.active || !this.ctx) return
    this.active = on
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.15)
  }

  update(f: RideAudioFrame, dt: number) {
    const ctx = this.ctx
    if (!ctx || !this.active) return
    const now = ctx.currentTime
    this.master.gain.setTargetAtTime(0.9 * f.level, now, 0.1)
    const v = f.speed
    const w = Math.min(1, Math.max(0, (v - 3) / 24))
    this.wind.gain.setTargetAtTime(w * w * 0.55, now, 0.08)
    this.windFilter.frequency.setTargetAtTime(250 + v * 90, now, 0.1)
    this.rumble.gain.setTargetAtTime(Math.min(1, v / 20) * 0.5, now, 0.08)
    this.hiss.gain.setTargetAtTime(f.braking ? 0.18 : 0, now, f.braking ? 0.05 : 0.3)
    // chain dogs: one click every ~0.35 m of travel
    if (f.onChain && v > 0.2 && f.level > 0) {
      this.clickTimer -= dt
      if (this.clickTimer <= 0) {
        this.clickTimer = 0.35 / v
        this.click(now)
      }
    }
  }

  private click(at: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 4
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.5, at)
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.04)
    src.connect(bp).connect(g).connect(this.master)
    src.start(at, Math.random() * 1.5, 0.05)
  }

  /** Two-tone departure bell. */
  bell() {
    const ctx = this.ctx
    if (!ctx || !this.active) return
    ;[0, 0.35].forEach((t, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = i ? 784 : 988
      const g = ctx.createGain()
      const at = ctx.currentTime + t
      g.gain.setValueAtTime(0.0001, at)
      g.gain.exponentialRampToValueAtTime(0.35, at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.6)
      o.connect(g).connect(this.master)
      o.start(at)
      o.stop(at + 0.65)
    })
  }
}

export const rideAudio = new RideAudio()
