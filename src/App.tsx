import { installKeyboard } from '@/core/input/keyboard'
import { Experience } from '@/world/Experience'
import { HUD } from '@/ui/HUD'
import { LoadingScreen } from '@/ui/LoadingScreen'
import { useGameInput } from '@/ui/useGameInput'

installKeyboard()

export default function App() {
  useGameInput()
  return (
    <>
      <Experience />
      <HUD />
      <LoadingScreen />
    </>
  )
}
