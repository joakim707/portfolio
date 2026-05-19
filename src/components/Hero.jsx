import { useEffect, useRef } from 'react'

const FLOAT_PIXELS = [
  { left: '8%',  duration: '7s',   delay: '0s',   color: 'var(--accent)' },
  { left: '22%', duration: '9s',   delay: '1s',   color: 'var(--accent2)' },
  { left: '55%', duration: '6s',   delay: '2s',   color: 'var(--yellow)' },
  { left: '70%', duration: '8s',   delay: '0.5s', color: 'var(--accent3)' },
  { left: '88%', duration: '10s',  delay: '3s',   color: 'var(--accent)' },
  { left: '40%', duration: '7.5s', delay: '1.5s', color: 'var(--accent2)', size: '4px' },
  { left: '63%', duration: '11s',  delay: '4s',   color: 'var(--accent3)', size: '12px' },
]

const SPRITE_COLORS = {
  skin: '#f5c17a', hair: '#1a1a2e', shirt: '#7c6cff',
  pants: '#2a2a40', eyes: '#00ff88', mouth: '#ff3c6e', acc: '#ffd700',
}

export default function Hero() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    const P = SPRITE_COLORS
    const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1) }

    ctx.clearRect(0, 0, 24, 24)

    [[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[3,3],[4,3],[20,3],[21,3]]
      .forEach(([x,y]) => px(x, y, P.hair))
    for (let y = 3; y <= 7; y++) for (let x = 5; x <= 18; x++) px(x, y, P.skin)
    [[7,5],[8,5],[14,5],[15,5]].forEach(([x,y]) => px(x, y, P.eyes))
    [[7,4],[8,4],[14,4],[15,4]].forEach(([x,y]) => px(x, y, P.hair))
    [[9,7],[10,7],[11,7],[12,7],[13,7]].forEach(([x,y]) => px(x, y, P.mouth))
    for (let y = 8; y <= 13; y++) for (let x = 4; x <= 19; x++) px(x, y, P.shirt)
    [[3,4],[3,5],[3,6],[20,4],[20,5],[20,6]].forEach(([x,y]) => px(x, y, '#333'))
    [[2,5],[21,5]].forEach(([x,y]) => px(x, y, '#555'))
    for (let y = 8; y <= 12; y++) {
      px(2, y, P.shirt); px(3, y, P.shirt); px(20, y, P.shirt); px(21, y, P.shirt)
    }
    [[2,13],[3,13],[20,13],[21,13]].forEach(([x,y]) => px(x, y, P.skin))
    for (let y = 14; y <= 18; y++) for (let x = 4; x <= 19; x++) px(x, y, P.pants)
    for (let y = 19; y <= 20; y++) {
      for (let x = 4;  x <= 10; x++) px(x, y, '#111')
      for (let x = 13; x <= 19; x++) px(x, y, '#111')
    }
    px(11, 10, P.acc); px(12, 10, P.acc); px(11, 11, P.acc); px(12, 11, P.acc)
  }, [])

  return (
    <section id="hero">
      {FLOAT_PIXELS.map((fp, i) => (
        <div
          key={i}
          className="float-pixel"
          style={{
            left: fp.left,
            animationDuration: fp.duration,
            animationDelay: fp.delay,
            background: fp.color,
            ...(fp.size ? { width: fp.size, height: fp.size } : {}),
          }}
        />
      ))}

      <canvas ref={canvasRef} id="sprite" width="24" height="24" />

      <div className="hero-tag">▶ PLAYER SELECT ◀</div>
      <h1 className="hero-name"><span>DJO</span><br />JOAKIM</h1>
      <p className="hero-sub">
        Concepteur Développeur d'Applications<br />
        <em>Fullstack · Alt M1 · Paris</em>
      </p>

      <div className="hp-wrap">
        <span className="hp-label">EXP</span>
        <div className="hp-bar"><div className="hp-fill" /></div>
        <span className="hp-text">LVL 3</span>
      </div>

      <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
        <span className="typing">REACT · C# · TYPESCRIPT · POSTGRES</span>
      </div>

      <div className="hero-btns">
        <a href="#projects" className="btn btn-green">▶ VOIR PROJETS</a>
        <a href="#contact" className="btn btn-pink">✉ ME CONTACTER</a>
      </div>
    </section>
  )
}
