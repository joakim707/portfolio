const FLOAT_PIXELS = [
  { left: '8%',  duration: '7s',   delay: '0s',   color: 'var(--accent)' },
  { left: '22%', duration: '9s',   delay: '1s',   color: 'var(--accent2)' },
  { left: '55%', duration: '6s',   delay: '2s',   color: 'var(--yellow)' },
  { left: '70%', duration: '8s',   delay: '0.5s', color: 'var(--accent3)' },
  { left: '88%', duration: '10s',  delay: '3s',   color: 'var(--accent)' },
  { left: '40%', duration: '7.5s', delay: '1.5s', color: 'var(--accent2)', size: '4px' },
  { left: '63%', duration: '11s',  delay: '4s',   color: 'var(--accent3)', size: '12px' },
]

function PixelSprite() {
  return (
    <svg
      width="96" height="96"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', marginBottom: '2rem', animation: 'bobbing 2s ease-in-out infinite', display: 'block' }}
    >
      {/* Hair */}
      <rect x="4" y="2" width="16" height="1" fill="#1a1a2e" />
      <rect x="3" y="3" width="2"  height="1" fill="#1a1a2e" />
      <rect x="20" y="3" width="2" height="1" fill="#1a1a2e" />
      {/* Face */}
      <rect x="5" y="3" width="14" height="5" fill="#f5c17a" />
      {/* Headphones */}
      <rect x="3"  y="4" width="1" height="3" fill="#333" />
      <rect x="20" y="4" width="1" height="3" fill="#333" />
      <rect x="2"  y="5" width="1" height="1" fill="#555" />
      <rect x="21" y="5" width="1" height="1" fill="#555" />
      {/* Eyebrows */}
      <rect x="7"  y="4" width="2" height="1" fill="#1a1a2e" />
      <rect x="14" y="4" width="2" height="1" fill="#1a1a2e" />
      {/* Eyes */}
      <rect x="7"  y="5" width="2" height="1" fill="#00ff88" />
      <rect x="14" y="5" width="2" height="1" fill="#00ff88" />
      {/* Mouth */}
      <rect x="9" y="7" width="5" height="1" fill="#ff3c6e" />
      {/* Shirt + Arms */}
      <rect x="4"  y="8" width="16" height="6" fill="#7c6cff" />
      <rect x="2"  y="8" width="2"  height="5" fill="#7c6cff" />
      <rect x="20" y="8" width="2"  height="5" fill="#7c6cff" />
      {/* Hands */}
      <rect x="2"  y="13" width="2" height="1" fill="#f5c17a" />
      <rect x="20" y="13" width="2" height="1" fill="#f5c17a" />
      {/* Pants */}
      <rect x="4" y="14" width="16" height="5" fill="#2a2a40" />
      {/* Shoes */}
      <rect x="4"  y="19" width="7" height="2" fill="#111" />
      <rect x="13" y="19" width="7" height="2" fill="#111" />
      {/* Star */}
      <rect x="11" y="10" width="2" height="2" fill="#ffd700" />
    </svg>
  )
}

export default function Hero() {
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

      <PixelSprite />

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
