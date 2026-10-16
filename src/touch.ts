import type { Action, KeyCap, LevelConfig } from './types'

const PHONE_SHORT_SIDE = 600

export function isCoarsePointer(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    navigator.maxTouchPoints > 0
  )
}

export function isPhoneScreen(): boolean {
  return Math.min(window.innerWidth, window.innerHeight) < PHONE_SHORT_SIDE
}

export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth
}

export function needsLandscapePrompt(): boolean {
  return isCoarsePointer() && isPhoneScreen() && isPortrait()
}

export async function tryLandscapeLock(): Promise<void> {
  if (!isPhoneScreen()) return
  const orientation = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> }
  const lock = (): void => {
    if (orientation && typeof orientation.lock === 'function') {
      void orientation.lock('landscape').catch(() => {
        /* unsupported or blocked */
      })
    }
  }
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    /* iOS and many desktop browsers reject fullscreen */
  }
  lock()
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

export function touchBarMarkup(
  level: LevelConfig,
  iconFor: (cap: KeyCap) => string,
  labelFor: (cap: KeyCap) => string,
): string {
  const enabled = new Set(level.actions)
  const hinted = new Set(level.hintActions)
  const button = (action: Action): string => {
    if (!enabled.has(action)) return ''
    const cap = ACTION_CAP[action]
    const neu = hinted.has(action) ? ' is-new' : ''
    return `<button class="touch-btn${neu}" type="button" data-touch="${action}" data-key="${cap}" aria-label="${labelFor(cap)}">${iconFor(cap)}</button>`
  }
  const hasY = enabled.has('moveUp') || enabled.has('moveDown')
  const move = `
    <div class="${hasY ? 'touch-dpad' : 'touch-x'}" data-touch-move>
      ${button('moveUp')}
      ${button('moveLeft')}
      ${button('moveRight')}
      ${button('moveDown')}
    </div>
  `
  const jumpAction: Action | null = enabled.has('jump') ? 'jump' : enabled.has('brake') ? 'brake' : null
  const actions = `
    <div class="touch-actions" data-touch-actions>
      ${jumpAction ? button(jumpAction) : ''}
      ${button('interact')}
    </div>
  `
  return `<div class="touch-bar" data-touch-bar>${move}${actions}</div>`
}

export function turnOverlayMarkup(title: string, hint: string): string {
  return `
    <div class="turn-overlay" data-turn hidden>
      <div class="turn-phone" aria-hidden="true">
        <span class="turn-phone-screen"></span>
        <span class="turn-phone-button"></span>
      </div>
      <p class="turn-title">${title}</p>
      <p class="turn-hint">${hint}</p>
    </div>
  `
}

export function bindTouchBar(
  root: HTMLElement,
  hold: (pointerId: number, action: Action) => void,
  release: (pointerId: number) => void,
): void {
  const bar = root.querySelector<HTMLElement>('[data-touch-bar]')
  if (!bar) return
  bar.addEventListener('contextmenu', (event) => event.preventDefault())
  bar.addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault()
    },
    { passive: false },
  )
  bar.querySelectorAll<HTMLButtonElement>('[data-touch]').forEach((button) => {
    const action = button.dataset.touch as Action
    const down = (event: PointerEvent): void => {
      event.preventDefault()
      try {
        button.setPointerCapture(event.pointerId)
      } catch {
        /* synthetic events and some browsers reject capture */
      }
      hold(event.pointerId, action)
    }
    const up = (event: PointerEvent): void => {
      event.preventDefault()
      try {
        if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
      release(event.pointerId)
    }
    button.addEventListener('pointerdown', down)
    button.addEventListener('pointerup', up)
    button.addEventListener('pointercancel', up)
    button.addEventListener('pointerleave', (event) => {
      if (!button.hasPointerCapture(event.pointerId)) release(event.pointerId)
    })
  })
}
