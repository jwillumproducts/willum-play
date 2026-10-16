import { padDown, samplePads } from './pads'
import type { Action, KeyCap } from './types'

const KEY_TO_ACTION: Record<string, Action> = {
  ArrowLeft: 'moveLeft',
  KeyA: 'moveLeft',
  ArrowRight: 'moveRight',
  KeyD: 'moveRight',
  ArrowUp: 'moveUp',
  KeyW: 'moveUp',
  ArrowDown: 'moveDown',
  KeyS: 'moveDown',
  Enter: 'interact',
  NumpadEnter: 'interact',
}

const CODE_TO_CAP: Record<string, KeyCap> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'space',
  Enter: 'enter',
  NumpadEnter: 'enter',
}

const BLOCK = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'NumpadEnter'])
const DEADZONE = 0.45
const PAD_BUTTON: Record<number, Action> = {
  14: 'moveLeft',
  15: 'moveRight',
  12: 'moveUp',
  13: 'moveDown',
}
const ACTION_CAP: Record<Action, KeyCap> = {
  moveLeft: 'left',
  moveRight: 'right',
  moveUp: 'up',
  moveDown: 'down',
  jump: 'space',
  brake: 'space',
  interact: 'enter',
}

export class InputManager {
  private readonly codes = new Set<string>()
  private readonly queued = new Set<Action>()
  private readonly enabled: Set<Action>
  private readonly glow = new Map<string, number>()
  private readonly padGlow = new Map<Action, number>()
  private padHeld = new Set<Action>()
  private readonly pointerActions = new Map<number, Action>()
  private readonly touchHeld = new Set<Action>()
  private readonly touchGlow = new Map<Action, number>()
  private menuDown = false
  private paused = false
  private readonly usePad: boolean
  private readonly onMenu: () => void

  constructor(actions: Action[], usePad = false, onMenu: () => void = () => {}) {
    this.enabled = new Set(actions)
    this.usePad = usePad
    this.onMenu = onMenu
    window.addEventListener('keydown', this.onDown)
    window.addEventListener('keyup', this.onUp)
  }

  poll(): void {
    if (!this.usePad) return
    const snap = samplePads()
    if (snap.kind !== 'ready' || !snap.pad) {
      this.padHeld.clear()
      this.menuDown = false
      return
    }

    const menu = padDown(snap.pad, 9)
    if (menu && !this.menuDown) this.onMenu()
    this.menuDown = menu

    const next = this.readPad(snap.pad)
    if (!this.paused) {
      const now = performance.now()
      for (const action of next) {
        if (this.padHeld.has(action) || this.keyboardHolds(action) || this.touchHeld.has(action)) continue
        this.queued.add(action)
        this.padGlow.set(action, now + 220)
      }
    }
    this.padHeld = next
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (paused) {
      this.queued.clear()
      this.glow.clear()
      this.padGlow.clear()
      this.touchGlow.clear()
    }
  }

  holdPointer(pointerId: number, action: Action): void {
    if (!this.enabled.has(action)) return
    const previous = this.pointerActions.get(pointerId)
    if (previous === action) return
    if (previous) this.releasePointer(pointerId)
    const already = this.isHeld(action)
    this.pointerActions.set(pointerId, action)
    this.touchHeld.add(action)
    if (!already && !this.paused) {
      this.queued.add(action)
      this.touchGlow.set(action, performance.now() + 220)
    }
  }

  releasePointer(pointerId: number): void {
    const action = this.pointerActions.get(pointerId)
    if (!action) return
    this.pointerActions.delete(pointerId)
    for (const held of this.pointerActions.values()) {
      if (held === action) return
    }
    this.touchHeld.delete(action)
  }

  activeCaps(): KeyCap[] {
    if (this.paused) return []
    const now = performance.now()
    const caps = new Set<KeyCap>()
    for (const code of this.codes) this.collect(code, caps)
    for (const action of this.padHeld) caps.add(ACTION_CAP[action])
    for (const action of this.touchHeld) caps.add(ACTION_CAP[action])
    for (const [code, until] of this.glow) {
      if (until < now) this.glow.delete(code)
      else this.collect(code, caps)
    }
    for (const [action, until] of this.padGlow) {
      if (until < now) this.padGlow.delete(action)
      else caps.add(ACTION_CAP[action])
    }
    for (const [action, until] of this.touchGlow) {
      if (until < now) this.touchGlow.delete(action)
      else caps.add(ACTION_CAP[action])
    }
    return [...caps]
  }

  isHeld(action: Action): boolean {
    if (!this.enabled.has(action)) return false
    if (this.padHeld.has(action)) return true
    if (this.touchHeld.has(action)) return true
    return this.keyboardHolds(action)
  }

  drainEdges(): Action[] {
    const list = [...this.queued]
    this.queued.clear()
    return list
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onDown)
    window.removeEventListener('keyup', this.onUp)
    this.codes.clear()
    this.queued.clear()
    this.glow.clear()
    this.padGlow.clear()
    this.padHeld.clear()
    this.pointerActions.clear()
    this.touchHeld.clear()
    this.touchGlow.clear()
  }

  private collect(code: string, caps: Set<KeyCap>): void {
    const action = this.actionFor(code)
    const cap = CODE_TO_CAP[code]
    if (!action || !cap || !this.enabled.has(action)) return
    caps.add(cap)
  }

  private keyboardHolds(action: Action): boolean {
    for (const code of this.codes) {
      if (this.actionFor(code) === action) return true
    }
    return false
  }

  private readPad(pad: Gamepad): Set<Action> {
    const held = new Set<Action>()
    for (const [index, action] of Object.entries(PAD_BUTTON)) {
      if (padDown(pad, Number(index)) && this.enabled.has(action)) held.add(action)
    }
    const x = pad.axes[0] ?? 0
    const y = pad.axes[1] ?? 0
    if (x < -DEADZONE && this.enabled.has('moveLeft')) held.add('moveLeft')
    if (x > DEADZONE && this.enabled.has('moveRight')) held.add('moveRight')
    if (y < -DEADZONE && this.enabled.has('moveUp')) held.add('moveUp')
    if (y > DEADZONE && this.enabled.has('moveDown')) held.add('moveDown')
    if (padDown(pad, 0)) {
      if (this.enabled.has('brake')) held.add('brake')
      else if (this.enabled.has('jump')) held.add('jump')
    }
    if (padDown(pad, 1) && this.enabled.has('interact')) held.add('interact')
    return held
  }

  private actionFor(code: string): Action | undefined {
    if (code === 'Space') {
      if (this.enabled.has('brake')) return 'brake'
      if (this.enabled.has('jump')) return 'jump'
      return undefined
    }
    return KEY_TO_ACTION[code]
  }

  private onDown = (event: KeyboardEvent): void => {
    const action = this.actionFor(event.code)
    if (!action) return
    if (!this.paused && BLOCK.has(event.code)) event.preventDefault()
    if (event.repeat) return
    const already = this.isHeld(action)
    this.codes.add(event.code)
    if (!already && this.enabled.has(action) && !this.paused) {
      this.queued.add(action)
      this.glow.set(event.code, performance.now() + 220)
    }
  }

  private onUp = (event: KeyboardEvent): void => {
    this.codes.delete(event.code)
  }
}
