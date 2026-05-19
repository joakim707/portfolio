import { useEffect } from 'react'

export default function Cursor() {
  useEffect(() => {
    const cur = document.getElementById('cursor')
    const move = e => {
      cur.style.left = (e.clientX - 8) + 'px'
      cur.style.top  = (e.clientY - 8) + 'px'
    }
    const down = () => cur.classList.add('click')
    const up   = () => cur.classList.remove('click')
    document.addEventListener('mousemove', move)
    document.addEventListener('mousedown', down)
    document.addEventListener('mouseup',   up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mousedown', down)
      document.removeEventListener('mouseup',   up)
    }
  }, [])

  return <div id="cursor" />
}
