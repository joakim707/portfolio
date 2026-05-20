import { Link } from 'react-router-dom'
import { PROJECTS } from '../data/projects'

export default function Projects() {
  return (
    <section id="projects">
      <p className="section-title">PROJETS</p>
      <div className="section-line" />
      <div className="projects-grid">
        {PROJECTS.map((p, i) => (
          <Link
            key={p.slug}
            to={`/project/${p.slug}`}
            className="project-card reveal"
            style={{ transitionDelay: `${i * 0.1}s`, textDecoration: 'none', display: 'block' }}
          >
            <span className={`project-tag ${p.tagClass}`}>{p.tag}</span>
            <h3 className="project-title">{p.emoji} {p.title}</h3>
            <p className="project-desc">{p.shortDesc}</p>
            <div className="project-stack">
              {p.stack.slice(0, 4).map(s => <span key={s} className="chip">{s}</span>)}
            </div>
            <div className="project-corner">{p.corner}</div>
            <div className="project-arrow">▶</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
