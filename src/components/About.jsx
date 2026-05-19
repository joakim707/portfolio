import { useEffect, useRef } from 'react'

const STATS = [
  { label: 'React/TS',   value: 88 },
  { label: 'C# / .NET',  value: 82 },
  { label: 'PostgreSQL', value: 76 },
  { label: 'Python',     value: 65 },
  { label: 'Kotlin',     value: 55 },
]

export default function About() {
  const statBoxRef = useRef(null)

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
    <section id="about">
      <p className="section-title">PROFIL</p>
      <div className="section-line" />
      <div className="about-grid reveal">
        <div className="about-text">
          <p>Salut, moi c'est <strong>Joakim</strong>.</p>
          <p>
            Étudiant en <strong>Bachelor Concepteur Développeur d'Applications (Bac+3)</strong> à{' '}
            <strong>l'EPSI Paris</strong>, en alternance, je développe des applications{' '}
            <strong>fullstack</strong> avec une attention particulière portée à l'UX, à
            l'architecture des projets et à la qualité du code.
          </p>
          <p>
            J'aime autant travailler sur le front-end que le back-end, concevoir des interfaces
            modernes et construire des solutions techniques propres, évolutives et intuitives.
          </p>
          <p>
            Curieux et créatif, je suis passionné de <strong>worldbuilding</strong>,{' '}
            de <strong>bande dessinée</strong> et de <strong>rétro gaming</strong>. Les univers
            pixel art et les directions artistiques minimalistes influencent beaucoup ma manière
            de créer et l'identité visuelle de mes projets.
          </p>
          <p>
            Mon objectif : concevoir des expériences numériques à la fois{' '}
            <strong>fonctionnelles, immersives et mémorables</strong>.
          </p>
        </div>
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
    </section>
  )
}
