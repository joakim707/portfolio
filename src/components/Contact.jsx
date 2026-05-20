export default function Contact() {
  return (
    <section id="contact">
      <p className="section-title">CONTACT</p>
      <div className="section-line" style={{ margin: '0 auto 3rem' }} />
      <div className="contact-box reveal">
        <h2 className="contact-title">PRÊT À COLLABORER ?</h2>
        <p className="contact-sub">Alternance M1 · Freelance · Projets perso</p>
        <div className="contact-links">
          <a href="mailto:joakimwilondja04@gmail.com" className="btn btn-green">✉ EMAIL</a>
          <a href="https://github.com/joakim707" target="_blank" rel="noreferrer" className="btn btn-pink">⌨ GITHUB</a>
          <a href="https://www.linkedin.com/in/joakim-wilondja/" target="_blank" rel="noreferrer" className="btn btn-green">💼 LINKEDIN</a>
        </div>
      </div>
    </section>
  )
}
