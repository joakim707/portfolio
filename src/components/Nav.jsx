import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()
  const home = pathname === '/'
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav>
      <div className="nav-logo">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>JOAKIM</Link>
      </div>
      <button className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
        {open ? '✕' : '☰'}
      </button>
      <ul className={`nav-links${open ? ' open' : ''}`}>
        <li><a href={home ? '#about' : '/#about'} onClick={close}>PROFIL</a></li>
        <li><a href={home ? '#projects' : '/#projects'} onClick={close}>PROJETS</a></li>
        <li><a href={home ? '#stack' : '/#stack'} onClick={close}>STACK</a></li>
        <li><Link to="/cv" onClick={close}>CV</Link></li>
        <li><a href={home ? '#contact' : '/#contact'} onClick={close}>CONTACT</a></li>
      </ul>
    </nav>
  )
}
