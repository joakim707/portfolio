import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Footer from '../components/Footer'

const FORMATIONS = [
  {
    date: '2023 — 2026',
    title: 'Bachelor Concepteur Développeur d\'Applications (Bac+3)',
    school: 'EPSI Paris',
    detail: 'En alternance · Spécialisation fullstack & architecture logicielle',
  },
  {
    date: '2020 — 2023',
    title: 'Baccalauréat Général',
    school: 'Lycée',
    detail: 'Spécialités Numérique & Sciences de l\'Ingénieur (NSI) · Mathématiques',
  },
]

const EXPERIENCES = [
  {
    date: '2023 — Présent',
    title: 'Développeur Fullstack — Alternance',
    company: 'Entreprise',
    detail: 'Conception et développement d\'applications web fullstack. React, TypeScript, ASP.NET Core, PostgreSQL.',
  },
]

const STATS = [
  { label: 'React / TS',  value: 88 },
  { label: 'C# / .NET',  value: 82 },
  { label: 'PostgreSQL',  value: 76 },
  { label: 'Python',      value: 65 },
  { label: 'Kotlin',      value: 55 },
]

const LANGUAGES = [
  { lang: 'Français',  level: 'Natif',          value: 100 },
  { lang: 'Anglais',   level: 'Professionnel',   value: 75 },
]

const INTERESTS = ['Worldbuilding', 'Bande dessinée', 'Rétro gaming', 'Pixel art', 'Architecture logicielle', 'IA & NLP']

export default function CVPage() {
  const statsRef = useRef(null)
  const langRef  = useRef(null)
  useReveal()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const targets = [statsRef.current, langRef.current].filter(Boolean)
    targets.forEach(box => {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          box.querySelectorAll('.stat-fill').forEach(bar => {
            bar.style.width = bar.dataset.w + '%'
          })
          obs.disconnect()
        }
      }, { threshold: 0.3 })
      obs.observe(box)
    })
  }, [])

  return (
    <div className="page-wrapper">
      {/* CV Header */}
      <div className="cv-header reveal">
        <Link to="/" className="back-btn" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>◀ RETOUR</Link>
        <p className="hero-tag" style={{ animation: 'none', marginBottom: '0.5rem' }}>▶ CURRICULUM VITAE ◀</p>
        <h1 className="cv-name">JOAKIM WILONDJA</h1>
        <p className="cv-title">Concepteur Développeur d'Applications · Bac+3</p>
        <div className="cv-contact-row">
          <span>joakimwilondja04@gmail.com</span>
          <span>·</span>
          <span>Paris, France</span>
          <span>·</span>
          <a href="https://github.com/joakim707" target="_blank" rel="noopener noreferrer" className="cv-link">GitHub</a>
        </div>
        <a href="/cv.pdf" download className="btn btn-green" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
          ▼ TÉLÉCHARGER LE PDF
        </a>
      </div>

      <div className="cv-body">
        {/* Left column */}
        <div>
          {/* Formation */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ FORMATION</p>
            {FORMATIONS.map(f => (
              <div className="cv-timeline-item" key={f.title}>
                <p className="cv-timeline-date">{f.date}</p>
                <p className="cv-timeline-title">{f.title}</p>
                <p className="cv-timeline-school">{f.school}</p>
                <p className="cv-timeline-sub">{f.detail}</p>
              </div>
            ))}
          </div>

          {/* Experience */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ EXPÉRIENCE</p>
            {EXPERIENCES.map(e => (
              <div className="cv-timeline-item" key={e.title}>
                <p className="cv-timeline-date">{e.date}</p>
                <p className="cv-timeline-title">{e.title}</p>
                <p className="cv-timeline-school">{e.company}</p>
                <p className="cv-timeline-sub">{e.detail}</p>
              </div>
            ))}
          </div>

          {/* Languages */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ LANGUES</p>
            <div className="stat-box" data-label="LANGUES" ref={langRef} style={{ marginBottom: 0 }}>
              {LANGUAGES.map(l => (
                <div className="stat-row" key={l.lang}>
                  <span className="stat-label">{l.lang}</span>
                  <div className="stat-bar">
                    <div className="stat-fill" data-w={l.value} />
                  </div>
                  <span className="stat-pct" style={{ fontSize: '7px', minWidth: '80px', textAlign: 'right', color: 'var(--dim)' }}>{l.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ CENTRES D'INTÉRÊT</p>
            <div className="project-stack">
              {INTERESTS.map(i => <span key={i} className="chip">{i}</span>)}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Skills */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ COMPÉTENCES TECHNIQUES</p>
            <div className="stat-box" data-label="PLAYER STATS" ref={statsRef}>
              {STATS.map(s => (
                <div className="stat-row" key={s.label}>
                  <span className="stat-label">{s.label}</span>
                  <div className="stat-bar">
                    <div className="stat-fill" data-w={s.value} />
                  </div>
                  <span className="stat-pct">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ OUTILS & ENVIRONNEMENT</p>
            <div className="project-stack" style={{ gap: '8px' }}>
              {['React', 'TypeScript', 'ASP.NET Core', 'PostgreSQL', 'Python', 'Kotlin', 'Docker', 'Supabase', 'Streamlit', 'Git / GitHub', 'Figma', 'LLM / OpenRouter'].map(t => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>

          {/* Projects preview */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ PROJETS SÉLECTIONNÉS</p>
            {['SWIPE · Réseau social e-commerce fullstack', 'MADELINE · Assistant IA avec mémoire utilisateur', 'HEALTHAI · Dashboard santé & data visualization', 'CORRIGE TES COURS · App éducative IA'].map(p => (
              <div key={p} className="cv-project-item">
                <span className="cv-project-dot">▶</span>
                <span>{p}</span>
              </div>
            ))}
            <Link to="/#projects" className="back-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
              VOIR TOUS LES PROJETS →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
