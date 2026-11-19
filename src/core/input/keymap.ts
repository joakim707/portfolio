/**
 * Bindings use KeyboardEvent.code (physical key position), so WASD on QWERTY
 * and ZQSD on AZERTY trigger the same actions with no layout detection.
 */
export const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  run: 'run',
  interact: 'interact',
  map: 'map',
  pause: 'pause',
} as const
export type Control = (typeof Controls)[keyof typeof Controls]

export const KEYMAP: { name: Control; keys: string[] }[] = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.run, keys: ['ShiftLeft', 'ShiftRight'] },
  { name: Controls.interact, keys: ['KeyE'] },
]
// M (map) and Échap (pause) are menu keys handled globally in ui/useGameInput.ts,
// matched by character so M works on both AZERTY and QWERTY.
