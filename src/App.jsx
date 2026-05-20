import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import CVPage from './pages/CVPage'
import ProfilePage from './pages/ProfilePage'

function KonamiCode() {
  useEffect(() => {
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]
    let ki = 0
    const handler = e => {
      if (e.keyCode === konami[ki]) {
        ki++
        if (ki === konami.length) {
          ki = 0
          document.body.style.filter = 'hue-rotate(180deg)'
          setTimeout(() => { document.body.style.filter = '' }, 2000)
        }
      } else {
        ki = 0
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <Cursor />
      <KonamiCode />
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:slug" element={<ProjectPage />} />
        <Route path="/cv" element={<CVPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}
