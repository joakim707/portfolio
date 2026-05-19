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
            <strong>l'EPSI Paris</strong>, en alternance, je conçois et développe des applications{' '}
            <strong>fullstack</strong> avec une attention particulière portée à l'expérience
            utilisateur, à l'architecture des projets et à la qualité du code. J'aime travailler
            aussi bien sur la partie front-end que back-end, réfléchir à la structure d'une
            application, optimiser son fonctionnement et créer des interfaces à la fois modernes,
            intuitives et agréables à utiliser.
          </p>
          <p>
            Au fil de mes projets, j'ai eu l'occasion d'explorer différentes technologies et méthodes
            de développement, ce qui m'a permis de renforcer ma <strong>capacité d'adaptation</strong>{' '}
            et ma manière de concevoir des solutions techniques solides. J'accorde également beaucoup
            d'importance à la logique derrière chaque projet : comprendre les besoins, imaginer une
            expérience cohérente et construire quelque chose de durable et évolutif.
          </p>
          <p>
            Curieux et créatif, je suis passionné de <strong>worldbuilding</strong>,{' '}
            de <strong>bande dessinée</strong> et de <strong>rétro gaming</strong>. Les jeux pixel art,
            les anciennes consoles et les directions artistiques minimalistes m'inspirent énormément —
            autant pour leur esthétique que pour leur capacité à transmettre des émotions avec
            simplicité. Cette influence se retrouve naturellement dans mes projets personnels, où
            j'aime mélanger modernité et inspirations rétro.
          </p>
          <p>
            Mon objectif : créer des expériences numériques qui soient à la fois{' '}
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
