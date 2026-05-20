import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Footer from '../components/Footer'

const STATS = [
  { label: 'React / TS',  value: 88 },
  { label: 'C# / .NET',  value: 82 },
  { label: 'PostgreSQL',  value: 76 },
  { label: 'Python',      value: 65 },
  { label: 'Kotlin',      value: 55 },
  { label: 'Docker',      value: 50 },
]

const SOFT_SKILLS = [
  { icon: '◈', label: 'Autonomie',         desc: "Je prends en main un projet de A à Z, de la conception à la mise en production." },
  { icon: '◈', label: 'Adaptabilité',      desc: "Je monte rapidement en compétences sur de nouveaux langages, frameworks ou contextes techniques." },
  { icon: '◈', label: 'Rigueur',           desc: "J'accorde beaucoup d'importance à la qualité du code, la lisibilité et la maintenabilité." },
  { icon: '◈', label: 'Curiosité',         desc: "Je me tiens régulièrement informé des évolutions tech, notamment en IA, UX et architecture." },
]

function PixelSprite() {
  return (
    <svg
      width="80" height="80"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      <rect x="4" y="2" width="16" height="1" fill="#1a1a2e" />
      <rect x="3" y="3" width="2"  height="1" fill="#1a1a2e" />
      <rect x="20" y="3" width="2" height="1" fill="#1a1a2e" />
      <rect x="5" y="3" width="14" height="5" fill="#f5c17a" />
      <rect x="3"  y="4" width="1" height="3" fill="#333" />
      <rect x="20" y="4" width="1" height="3" fill="#333" />
      <rect x="2"  y="5" width="1" height="1" fill="#555" />
      <rect x="21" y="5" width="1" height="1" fill="#555" />
      <rect x="7"  y="4" width="2" height="1" fill="#1a1a2e" />
      <rect x="14" y="4" width="2" height="1" fill="#1a1a2e" />
      <rect x="7"  y="5" width="2" height="1" fill="#00ff88" />
      <rect x="14" y="5" width="2" height="1" fill="#00ff88" />
      <rect x="9" y="7" width="5" height="1" fill="#ff3c6e" />
      <rect x="4"  y="8" width="16" height="6" fill="#7c6cff" />
      <rect x="2"  y="8" width="2"  height="5" fill="#7c6cff" />
      <rect x="20" y="8" width="2"  height="5" fill="#7c6cff" />
      <rect x="2"  y="13" width="2" height="1" fill="#f5c17a" />
      <rect x="20" y="13" width="2" height="1" fill="#f5c17a" />
      <rect x="4" y="14" width="16" height="5" fill="#2a2a40" />
      <rect x="4"  y="19" width="7" height="2" fill="#111" />
      <rect x="13" y="19" width="7" height="2" fill="#111" />
      <rect x="11" y="10" width="2" height="2" fill="#ffd700" />
    </svg>
  )
}

export default function ProfilePage() {
  const statBoxRef = useRef(null)
  useReveal()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const box = statBoxRef.current
    if (!box) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        box.querySelectorAll('.stat-fill').forEach(bar => {
          bar.style.width = bar.dataset.w + '%'
        })
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(box)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div className="profile-hero">
        <PixelSprite />
        <div className="hero-tag" style={{ marginBottom: '0.5rem' }}>▶ PLAYER PROFILE ◀</div>
        <h1 className="profile-page-name">JOAKIM</h1>
        <p className="profile-page-sub">Concepteur Développeur d'Applications · Bac+3<br /><em style={{ color: 'var(--accent3)', fontStyle: 'normal' }}>EPSI Paris · Alternance · Fullstack</em></p>
        <Link to="/cv" className="btn btn-green" style={{ marginTop: '1.5rem', display: 'inline-block' }}>▶ VOIR MON CV</Link>
      </div>

      <div className="profile-body">
        {/* Bio */}
        <div className="profile-section reveal">
          <p className="section-title">BIO</p>
          <div className="section-line" />
          <div className="about-text">
            <p>Étudiant en <strong>Bachelor Concepteur Développeur d'Applications (Bac+3)</strong> à <strong>l'EPSI Paris</strong>, en alternance, je développe des applications <strong>fullstack</strong> avec une attention particulière portée à l'UX, à l'architecture des projets et à la qualité du code.</p>
            <p>J'aime autant travailler sur le front-end que le back-end, concevoir des interfaces modernes et construire des solutions techniques propres, évolutives et intuitives.</p>
            <p>Curieux et créatif, je suis passionné de <strong>worldbuilding</strong>, de <strong>bande dessinée</strong> et de <strong>rétro gaming</strong>. Les univers pixel art et les directions artistiques minimalistes influencent beaucoup ma manière de créer et l'identité visuelle de mes projets.</p>
            <p>Mon objectif : concevoir des expériences numériques à la fois <strong>fonctionnelles, immersives et mémorables</strong>.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-section reveal">
          <p className="section-title">COMPÉTENCES</p>
          <div className="section-line" />
          <div className="stat-box" data-label="PLAYER STATS" ref={statBoxRef}>
            {STATS.map(stat => (
              <div className="stat-row" key={stat.label}>
                <span className="stat-label">{stat.label}</span>
                <div className="stat-bar">
                  <div className="stat-fill" data-w={stat.value} />
                </div>
                <span className="stat-pct">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Soft skills */}
        <div className="profile-section reveal">
          <p className="section-title">MÉTHODE DE TRAVAIL</p>
          <div className="section-line" />
          <div className="soft-skills-grid">
            {SOFT_SKILLS.map(s => (
              <div className="soft-skill-card" key={s.label}>
                <span className="soft-skill-icon">{s.icon}</span>
                <p className="soft-skill-label">{s.label}</p>
                <p className="soft-skill-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Looking for */}
        <div className="profile-section reveal">
          <p className="section-title">CE QUE JE RECHERCHE</p>
          <div className="section-line" />
          <div className="looking-for-box">
            <p>Je suis actuellement en <strong>alternance (rythme 3 semaines entreprise / 1 semaine école)</strong>, à la recherche de missions stimulantes alliant <strong>développement fullstack</strong>, <strong>architecture technique</strong> et expériences utilisateur soignées.</p>
            <p>J'apprécie particulièrement les environnements où l'initiative est valorisée, où on peut proposer, expérimenter et contribuer au-delà de sa fiche de poste.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
