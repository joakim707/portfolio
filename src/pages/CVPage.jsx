import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Footer from '../components/Footer'

const FORMATIONS = [
  {
    date: '2025 — Présent',
    title: 'Bachelor CDA — Concepteur Développeur d\'Application',
    subtitle: 'Niveau 6 (RNCP)',
    school: 'EPSI Paris',
    detail: 'Alternance — 2 semaines entreprise / 1 semaine formation',
  },
  {
    date: '2023 — 2025',
    title: 'Développeur web et web mobile — Bac+2',
    subtitle: '',
    school: 'ESIEA',
    detail: '',
  },
]

const EXPERIENCES = [
  {
    date: '2025 — 2026',
    title: 'Projet HealthAI',
    company: 'EPSI Paris',
    desc: 'Application de visualisation de données de santé.',
    bullets: [
      'Application Python / Streamlit',
      'Intégration et traitement de données (CSV / JSON)',
      'Tableaux de bord interactifs (graphiques, indicateurs)',
      'Organisation Agile (backlog, sprints)',
    ],
  },
  {
    date: '2025',
    title: 'Projet Swipe',
    company: 'ESIEA',
    desc: 'Plateforme e-commerce inspirée des réseaux sociaux (format vidéo type TikTok).',
    bullets: [
      'Front-end React / TypeScript',
      'API ASP.NET Core + authentification JWT',
      'Base de données PostgreSQL',
      'Publications, commentaires, panier',
    ],
  },
  {
    date: '2024 — 2025',
    title: 'Projet Competencia',
    company: 'ESIEA',
    desc: 'Outil de suivi des compétences des élèves.',
    bullets: [
      'Modélisation UML et base de données',
      'Tableau de bord interactif',
      'Gestion des rôles utilisateurs',
      'Travail en équipe — méthodologie Agile',
    ],
  },
]

const SKILLS = [
  {
    category: 'Front-end',
    items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React'],
  },
  {
    category: 'Back-end & BDD',
    items: ['C#', 'ASP.NET Core', 'PostgreSQL', 'Modélisation de données'],
  },
  {
    category: 'Outils & Méthodo',
    items: ['Git', 'GitHub', 'Visual Studio', 'VS Code', 'Swagger', 'Méthodes agiles'],
  },
]

const LANGUAGES = [
  { lang: 'Français', level: 'Langue maternelle', value: 100 },
  { lang: 'Anglais',  level: 'B1',                value: 50  },
]

const QUALITIES = [
  'Sérieux & ponctuel',
  'Adaptable & motivé',
  'Bon relationnel',
  'Esprit d\'analyse',
]

export default function CVPage() {
  const langRef = useRef(null)
  useReveal()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const box = langRef.current
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

      {/* Header */}
      <div className="cv-header reveal">
        <Link to="/" className="back-btn" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>◀ RETOUR</Link>
        <p className="hero-tag" style={{ animation: 'none', marginBottom: '0.5rem' }}>▶ CURRICULUM VITAE ◀</p>
        <h1 className="cv-name">WILONDJA JOAKIM</h1>
        <p className="cv-title">Recherche un stage en développement web & logiciel</p>
        <div className="cv-contact-row">
          <span>07 53 39 94 14</span>
          <span>·</span>
          <span>joakimwilondja04@gmail.com</span>
          <span>·</span>
          <span>94400 Vitry-sur-Seine</span>
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

          {/* Profile */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ PROFIL</p>
            <p className="cv-timeline-sub" style={{ lineHeight: '1.7', fontSize: '19px' }}>
              Étudiant concepteur développeur d'applications à l'EPSI Paris (Bac+3, alternance 2 semaines entreprise / 1 semaine formation), sérieux, motivé et polyvalent. À l'aise avec les outils numériques et le travail en équipe, doté d'un bon esprit d'analyse et d'une capacité d'adaptation rapide. J'ai réalisé plusieurs projets concrets (application web, modélisation BDD, conception UML) qui m'ont permis de couvrir l'ensemble du cycle de développement, de l'analyse au déploiement.
            </p>
          </div>

          {/* Formation */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ FORMATION</p>
            {FORMATIONS.map(f => (
              <div className="cv-timeline-item" key={f.title}>
                <p className="cv-timeline-date">{f.date}</p>
                <p className="cv-timeline-title">{f.title}</p>
                {f.subtitle && <p className="cv-timeline-sub" style={{ color: 'var(--accent3)', marginBottom: '0.2rem' }}>{f.subtitle}</p>}
                <p className="cv-timeline-school">{f.school}</p>
                {f.detail && <p className="cv-timeline-sub">{f.detail}</p>}
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

          {/* Qualities */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ QUALITÉS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {QUALITIES.map(q => (
                <div key={q} className="cv-project-item">
                  <span className="cv-project-dot">▶</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column */}
        <div>

          {/* Experiences */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ EXPÉRIENCES — PROJETS</p>
            {EXPERIENCES.map(e => (
              <div className="cv-timeline-item" key={e.title}>
                <p className="cv-timeline-date">{e.date}</p>
                <p className="cv-timeline-title">{e.title}</p>
                <p className="cv-timeline-school">{e.company}</p>
                <p className="cv-timeline-sub" style={{ marginBottom: '0.5rem' }}>{e.desc}</p>
                {e.bullets.map(b => (
                  <div key={b} className="cv-project-item" style={{ marginBottom: '0.3rem' }}>
                    <span className="cv-project-dot" style={{ color: 'var(--dim)' }}>–</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="cv-section reveal">
            <p className="cv-section-title">◈ COMPÉTENCES TECHNIQUES</p>
            {SKILLS.map(cat => (
              <div key={cat.category} style={{ marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'var(--pixel)', fontSize: '7px', color: 'var(--accent3)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                  {cat.category}
                </p>
                <div className="project-stack" style={{ gap: '6px' }}>
                  {cat.items.map(i => <span key={i} className="chip">{i}</span>)}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
