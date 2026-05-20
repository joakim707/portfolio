import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()
  const home = pathname === '/'

  return (
    <nav>
      <div className="nav-logo">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>DJO.DEV</Link>
      </div>
      <ul className="nav-links">
        <li><a href={home ? '#about' : '/#about'}>PROFIL</a></li>
        <li><a href={home ? '#projects' : '/#projects'}>PROJETS</a></li>
        <li><a href={home ? '#stack' : '/#stack'}>STACK</a></li>
        <li><Link to="/cv">CV</Link></li>
        <li><a href={home ? '#contact' : '/#contact'}>CONTACT</a></li>
      </ul>
    </nav>
  )
}
