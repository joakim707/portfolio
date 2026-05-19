import { useEffect } from 'react'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Stack from './components/Stack'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    reveals.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

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

  return (
    <>
      <Cursor />
      <Nav />
      <Hero />
      <About />
      <Projects />
      <Stack />
      <Contact />
      <Footer />
    </>
  )
}
