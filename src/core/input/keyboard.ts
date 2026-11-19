import { KEYMAP, type Control } from './keymap'

/**
 * Framework-free keyboard state, read every frame by the player controller.
 * Deliberately not a React context: contexts defined outside <Canvas> must be
 * bridged into the R3F renderer, and that bridge proved unreliable in
 * production builds. Plain module state works everywhere.
 */
const pressed = new Set<string>()
const codesFor = new Map<Control, string[]>(KEYMAP.map((k) => [k.name, k.keys]))

let installed = false
export function installKeyboard() {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('keydown', (e) => {
    // ignore typing in form fields
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    pressed.add(e.code)
  })
  window.addEventListener('keyup', (e) => pressed.delete(e.code))
  // releasing keys while the tab is hidden would otherwise leave them "stuck"
  window.addEventListener('blur', () => pressed.clear())
  document.addEventListener('visibilitychange', () => document.hidden && pressed.clear())
}

export function isDown(control: Control) {
  const codes = codesFor.get(control)
  return !!codes && codes.some((c) => pressed.has(c))
}
