import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { getProject } from '../data/projects'
import { useReveal } from '../hooks/useReveal'
import Footer from '../components/Footer'

const MOCKUP_HEIGHTS = {
  healthai:             430,
  swipe:                490,
  madeline:             450,
  'weather-report':     510,
  'gestionnaire-ia':    440,
  'corrige-tes-cours':  470,
}

const STATUS_MAP = {
  done:    { label: 'TERMINÉ',   cls: 'status-done' },
  wip:     { label: 'EN COURS',  cls: 'status-wip' },
  concept: { label: 'CONCEPT',   cls: 'status-concept' },
}

export default function ProjectPage() {
  const { slug } = useParams()
  const project = getProject(slug)

  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (!project) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}>
        <p style={{ fontFamily: 'var(--pixel)', fontSize: '12px', color: 'var(--accent2)' }}>PROJET INTROUVABLE</p>
        <Link to="/" className="back-btn">◀ RETOUR</Link>
      </div>
    )
  }

  useReveal()

  const status = STATUS_MAP[project.status]
  const iframeHeight = MOCKUP_HEIGHTS[slug] ?? 440

  return (
    <div className="page-wrapper">
      <div className="project-page-hero">
        <Link to="/#projects" className="back-btn">◀ RETOUR AUX PROJETS</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span className={`project-tag ${project.tagClass}`}>{project.tag}</span>
          {status && <span className={`status-badge ${status.cls}`}>{status.label}</span>}
        </div>

        <h1 className="project-page-title">
          {project.emoji} {project.title}
        </h1>

        <div className="project-stack" style={{ marginBottom: '0' }}>
          {project.stack.map(s => <span key={s} className="chip">{s}</span>)}
        </div>
      </div>

      <div className="project-page-body">
        {/* Left: mockup */}
        <div>
          <div className="mockup-frame reveal" style={{ padding: 0, display: 'block' }}>
            <iframe
              src={`/maquettes/${slug}.html`}
              title={`Maquette ${project.title}`}
              style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', display: 'block' }}
              loading="lazy"
            />
          </div>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-green"
              style={{ marginTop: '1.5rem', display: 'inline-block' }}
            >
              ▶ VOIR LE CODE
            </a>
          )}
        </div>

        {/* Right: details */}
        <div className="reveal">
          <div className="detail-block">
            <p className="detail-label">DESCRIPTION</p>
            <p className="detail-text">{project.fullDesc}</p>
          </div>

          <div className="detail-block">
            <p className="detail-label">PROBLÈME RÉSOLU</p>
            <p className="detail-text">{project.problem}</p>
          </div>

          <div className="detail-block">
            <p className="detail-label">CHOIX TECHNIQUES</p>
            <p className="detail-text">{project.techChoices}</p>
          </div>

          <div className="detail-block">
            <p className="detail-label">DIFFICULTÉS</p>
            <p className="detail-text">{project.challenges}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
