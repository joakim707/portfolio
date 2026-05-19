const STACK = [
  { icon: '⚛️', name: 'React' },
  { icon: '🔷', name: 'TypeScript' },
  { icon: '🔵', name: 'C# / .NET' },
  { icon: '🐘', name: 'PostgreSQL' },
  { icon: '🐍', name: 'Python' },
  { icon: '📱', name: 'Kotlin' },
  { icon: '⚡', name: 'Supabase' },
  { icon: '🌊', name: 'Streamlit' },
  { icon: '🐙', name: 'Git / GitHub' },
  { icon: '🐳', name: 'Docker' },
  { icon: '🤖', name: 'Groq / LLM' },
  { icon: '🎨', name: 'Figma' },
]

export default function Stack() {
  return (
    <section id="stack">
      <p className="section-title">INVENTAIRE TECH</p>
      <div className="section-line" />
      <div className="stack-grid reveal">
        {STACK.map(item => (
          <div key={item.name} className="stack-item">
            <span className="stack-icon">{item.icon}</span>
            <span className="stack-name">{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
