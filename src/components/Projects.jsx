const PROJECTS = [
  {
    tag: 'DATA',
    tagClass: 'tag-school',
    title: '🧠 HEALTHAI',
    desc: "App de visualisation santé & lifestyle. Tableaux de bord dynamiques Plotly, analyse nutrition, activité physique et détection d'anomalies sur données réelles.",
    stack: ['Streamlit', 'Plotly', 'Python', 'Data Viz'],
    corner: '❤',
  },
  {
    tag: 'FULLSTACK',
    tagClass: 'tag-perso',
    title: '📱 SWIPE',
    desc: 'Réseau social e-commerce inspiré du scroll vertical. Swipe horizontal pour panier intégré, auth JWT, likes/commentaires/partages.',
    stack: ['React', 'TypeScript', 'ASP.NET Core', 'JWT'],
    corner: '▶',
  },
  {
    tag: 'IA',
    tagClass: 'tag-perso',
    title: '🤖 MADELINE',
    desc: 'Assistant conversationnel personnalisé avec mémoire utilisateur. Intégration API IA Google, architecture client-serveur, perspectives vocales.',
    stack: ['React', 'ASP.NET', 'Google AI', 'NLP'],
    corner: '🤖',
  },
  {
    tag: 'API',
    tagClass: 'tag-team',
    title: '🌦️ WEATHER REPORT',
    desc: "Météo + recommandations d'activités locales contextualisées. Intégration Open-Meteo & OpenStreetMap, données temps réel, UX orientée quotidien.",
    stack: ['Open-Meteo', 'OpenStreetMap', 'API REST', 'Temps réel'],
    corner: '⛅',
  },
  {
    tag: 'IA',
    tagClass: 'tag-perso',
    title: '🗂️ GESTIONNAIRE IA',
    desc: "Organisation intelligente de fichiers & documents. Classification automatique, recherche sémantique, analyse de contenu — productivité augmentée par l'IA.",
    stack: ['IA', 'Classif. auto', 'NLP', 'Productivité'],
    corner: '✦',
  },
  {
    tag: 'EDTECH',
    tagClass: 'tag-school',
    title: '📚 CORRIGE TES COURS',
    desc: "App éducative IA pour étudiants : correction d'exercices, résumés de cours, fiches de révision et quiz interactifs adaptés par matière via OpenRouter.",
    stack: ['OpenRouter', 'LLM', 'Web', 'Pédagogie'],
    corner: '📖',
  },
]

export default function Projects() {
  return (
    <section id="projects">
      <p className="section-title">PROJETS</p>
      <div className="section-line" />
      <div className="projects-grid">
        {PROJECTS.map((p, i) => (
          <div
            key={p.title}
            className="project-card reveal"
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <span className={`project-tag ${p.tagClass}`}>{p.tag}</span>
            <h3 className="project-title">{p.title}</h3>
            <p className="project-desc">{p.desc}</p>
            <div className="project-stack">
              {p.stack.map(s => <span key={s} className="chip">{s}</span>)}
            </div>
            <div className="project-corner">{p.corner}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
