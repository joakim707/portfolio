import Hero from '../components/Hero'
import About from '../components/About'
import Projects from '../components/Projects'
import Stack from '../components/Stack'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import { useReveal } from '../hooks/useReveal'

export default function HomePage() {
  useReveal()
  return (
    <>
      <Hero />
      <About />
      <Projects />
      <Stack />
      <Contact />
      <Footer />
    </>
  )
}
