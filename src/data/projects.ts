/**
 * Project sheets shown after each ride and in recruiter mode.
 *
 * RULE: only facts provided by Joakim go here. Anything not provided yet is
 * left null / empty and the UI shows "à compléter" — never invent details.
 * Sources so far: previous portfolio (src/data/projects.js), the CV page, and
 * the SmartGamble sheet written by Joakim (Nov 2026).
 */
export type ProjectStatus = 'done' | 'wip' | 'concept' | 'upcoming'

export interface Project {
  slug: string
  title: string
  tagline: string | null
  description: string | null
  problem: string | null
  stack: string[]
  features: string[]
  challenges: string | null
  solutions: string | null
  screenshots: string[]
  github: string | null
  demo: string | null
  status: ProjectStatus
  context: string | null
  /** Project type, e.g. "Projet professionnel — Stage de développement web". */
  kind: string | null
  role: string | null
  period: string | null
  /** What Joakim personally did: area → description. */
  contributions: { area: string; text: string }[]
  skills: string[]
  learnings: string | null
}

const empty = {
  tagline: null,
  description: null,
  problem: null,
  stack: [],
  features: [],
  challenges: null,
  solutions: null,
  screenshots: [],
  github: null,
  demo: null,
  context: null,
  kind: null,
  role: null,
  period: null,
  contributions: [],
  skills: [],
  learnings: null,
} satisfies Partial<Project>

export const PROJECTS: Project[] = [
  {
    ...empty,
    slug: 'smartgamble',
    title: 'SmartGamble',
    tagline: "Application web d'analyse et de statistiques footballistiques.",
    kind: 'Projet professionnel — Stage de développement web',
    context: 'Afinum — EPSI WIS Paris',
    period: 'Avril – Juillet 2026',
    role: 'Développeur Full Stack',
    description:
      "SmartGamble est une plateforme web dédiée à l'analyse de matchs de football. Elle centralise différentes données sportives pour permettre aux utilisateurs de consulter les performances des équipes, les statistiques des joueurs, les compositions et les rencontres.",
    problem:
      "L'objectif était de transformer des données sportives brutes en informations structurées, accessibles et facilement exploitables à travers une interface web.",
    stack: ['Next.js', 'React', 'TypeScript', 'Python', 'PostgreSQL', 'GitHub Actions', 'Git', 'GitHub'],
    features: [
      'Consultation des matchs de football.',
      'Affichage des statistiques des équipes et des joueurs.',
      "Consultation des compositions d'équipes.",
      'Récupération et traitement automatisés des données sportives.',
      'Stockage et organisation des informations dans PostgreSQL.',
      'Actualisation automatique des données toutes les 12 heures.',
    ],
    contributions: [
      { area: 'Développement web', text: 'Création et intégration de fonctionnalités avec Next.js et TypeScript.' },
      {
        area: 'Traitement des données',
        text: 'Utilisation de scripts Python pour récupérer et structurer les informations relatives aux matchs, aux statistiques, aux performances et aux compositions.',
      },
      { area: 'Base de données', text: "Exploitation de PostgreSQL pour organiser les données sportives et faciliter leur utilisation dans l'application." },
      { area: 'Automatisation', text: "Mise en place d'un système d'actualisation périodique des données avec GitHub Actions." },
    ],
    challenges:
      "L'un des principaux enjeux du projet était la gestion des données sportives : leur récupération, leur organisation et leur actualisation. Il fallait également assurer la cohérence des informations entre les scripts Python, la base PostgreSQL et l'interface Next.js.",
    solutions:
      'La mise en place d’une actualisation automatique toutes les 12 heures a permis de limiter les interventions manuelles et de rendre le processus de collecte plus régulier.',
    skills: [
      'Développement Full Stack',
      'TypeScript',
      'React',
      'Next.js',
      'Python',
      'PostgreSQL',
      'Automatisation',
      'GitHub Actions',
      'Traitement de données',
    ],
    learnings:
      "SmartGamble m'a permis de renforcer mes compétences en développement Full Stack et de travailler sur une application reposant sur plusieurs technologies complémentaires. J'ai également approfondi ma compréhension des processus automatisés de collecte et de traitement des données, ainsi que de leur intégration dans une application web.",
    // internship ran April–July 2026
    status: 'done',
  },
  {
    ...empty,
    slug: 'swipe',
    title: 'Swipe',
    tagline: 'Réseau social e-commerce inspiré du scroll vertical.',
    description:
      "Swipe est un réseau social e-commerce inspiré du scroll vertical à la TikTok. Chaque produit est présenté en plein écran, avec un swipe horizontal pour l'ajouter au panier. L'app inclut un système d'authentification JWT, un flux social complet avec likes, commentaires et partages, et une architecture fullstack découplée.",
    problem:
      "Les plateformes e-commerce classiques manquent d'engagement et de fluidité. L'idée : reproduire la mécanique addictive du scroll vertical des réseaux sociaux au service de la découverte de produits.",
    stack: ['React', 'TypeScript', 'ASP.NET Core', 'JWT', 'PostgreSQL'],
    features: [
      'Front-end React / TypeScript',
      'API ASP.NET Core + authentification JWT',
      'Base de données PostgreSQL',
      'Publications, commentaires, panier',
    ],
    challenges:
      "La gestion des gestures touch (swipe horizontal sans interférer avec le scroll vertical natif) était le principal défi technique. Côté back, l'optimisation du flux social (likes, commentaires) a demandé une réflexion sur les requêtes et le cache.",
    solutions:
      "React + TypeScript côté front pour la robustesse des types. ASP.NET Core pour l'API REST. JWT pour une authentification stateless.",
    screenshots: ['/maquettes/swipe.html'],
    status: 'wip',
    context: 'ESIEA — 2025',
  },
  {
    ...empty,
    slug: 'corrige-tes-cours',
    title: 'Corrige tes cours',
    tagline: 'App éducative IA pour étudiants.',
    description:
      "Corrige tes cours utilise des LLMs via OpenRouter pour corriger des exercices, générer des résumés de cours adaptés, créer des fiches de révision et proposer des quiz interactifs par matière.",
    problem:
      "Les étudiants manquent de feedback immédiat sur leurs exercices en dehors des heures de cours. L'IA peut jouer le rôle d'un tuteur disponible 24h/24.",
    stack: ['OpenRouter', 'LLM', 'JavaScript', 'Web'],
    features: ["Correction d'exercices", 'Résumés de cours', 'Fiches de révision', 'Quiz interactifs par matière'],
    challenges:
      "Calibrer la qualité des corrections générées : les réponses doivent être pédagogiques et adaptées au niveau de l'étudiant. Éviter les hallucinations sur des contenus de cours spécifiques.",
    solutions:
      "OpenRouter donne accès à plusieurs modèles via une API unifiée, pour choisir le meilleur modèle par cas d'usage. Prompt engineering soigné.",
    screenshots: ['/maquettes/corrige-tes-cours.html'],
    status: 'wip',
  },
  {
    ...empty,
    slug: 'healthiai',
    title: 'HealthIAi',
    tagline: 'Visualisation de données santé & lifestyle.',
    description:
      "Application de visualisation de données santé et lifestyle construite avec Streamlit et Plotly. Elle agrège des données de nutrition, d'activité physique et de métriques vitales pour générer des tableaux de bord interactifs et détecter des anomalies.",
    problem:
      'Difficile de visualiser ses données de santé issues de différentes sources (alimentation, activité, sommeil) en un seul endroit.',
    stack: ['Python', 'Streamlit', 'Plotly', 'Pandas'],
    features: [
      'Intégration et traitement de données (CSV / JSON)',
      'Tableaux de bord interactifs (graphiques, indicateurs)',
      "Détection d'anomalies",
      'Organisation Agile (backlog, sprints)',
    ],
    challenges:
      "Normaliser des données hétérogènes (unités, fréquences d'échantillonnage). Détecter les anomalies sans faux positifs.",
    solutions:
      'Nettoyage et analyse avec Pandas, approche statistique robuste pour la détection, Plotly pour des graphiques interactifs.',
    screenshots: ['/maquettes/healthai.html'],
    status: 'done',
    context: 'EPSI Paris — 2025-2026',
  },
  {
    ...empty,
    slug: 'mindora',
    title: 'Mindora',
    status: 'wip',
  },
  {
    ...empty,
    slug: 'competencia',
    title: 'Competencia',
    tagline: 'Outil de suivi des compétences des élèves.',
    features: [
      'Modélisation UML et base de données',
      'Tableau de bord interactif',
      'Gestion des rôles utilisateurs',
      'Travail en équipe — méthodologie Agile',
    ],
    status: 'done',
    context: 'ESIEA — 2024-2025',
  },
  { ...empty, slug: 'spectre', title: 'SPECTRE', status: 'upcoming' },
  { ...empty, slug: 'aquabot', title: 'AQUABOT', status: 'upcoming' },
]

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug) ?? null

export const DEVELOPER = {
  name: 'Joakim Wilondja',
  role: 'Étudiant Concepteur Développeur d’Application — EPSI Paris (alternance)',
  email: 'joakimwilondja04@gmail.com',
  github: 'https://github.com/joakim707',
  linkedin: 'https://www.linkedin.com/in/joakim-wilondja/',
}
