import type { Action, KeyCap, LevelConfig } from './types'

const PHONE_SHORT_SIDE = 600

export function isCoarsePointer(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    navigator.maxTouchPoints > 0
  )
}

function positive(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function smallViewport(): { width: number; height: number } {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;left:0;top:0;width:100svw;height:100svh;pointer-events:none;visibility:hidden'
  document.documentElement.appendChild(probe)
  const rect = probe.getBoundingClientRect()
  probe.remove()
  return {
    width: positive(rect.width, Number.POSITIVE_INFINITY),
    height: positive(rect.height, Number.POSITIVE_INFINITY),
  }
}

export function visualBox(): { left: number; top: number; width: number; height: number } {
  const vv = window.visualViewport
  const innerW = positive(window.innerWidth, 1)
  const innerH = positive(window.innerHeight, 1)
  const clientW = positive(document.documentElement.clientWidth, innerW)
  const clientH = positive(document.documentElement.clientHeight, innerH)
  const vvW = positive(vv?.width, innerW)
  const vvH = positive(vv?.height, innerH)
  const sv = smallViewport()
  return {
    left: vv?.offsetLeft ?? 0,
    top: vv?.offsetTop ?? 0,
    width: Math.max(1, Math.min(vvW, innerW, clientW, sv.width)),
    height: Math.max(1, Math.min(vvH, innerH, clientH, sv.height)),
  }
}

export function isPhoneScreen(): boolean {
  const box = visualBox()
  return Math.min(box.width, box.height) < PHONE_SHORT_SIDE
}

export function isPortrait(): boolean {
  const box = visualBox()
  return box.height > box.width
}

export function needsLandscapePrompt(): boolean {
  return isCoarsePointer() && isPhoneScreen() && isPortrait()
}

export function pinPlaySurface(play: HTMLElement, stage: HTMLElement, canvas: HTMLCanvasElement): void {
  const box = visualBox()
  const viewW = Math.round(box.width)
  const viewH = Math.round(box.height)
  const root = document.documentElement
  root.style.setProperty('--vv-w', `${viewW}px`)
  root.style.setProperty('--vv-h', `${viewH}px`)

  play.style.position = 'fixed'
  play.style.inset = 'auto'
  play.style.right = 'auto'
  play.style.bottom = 'auto'
  play.style.left = `${box.left}px`
  play.style.top = `${box.top}px`
  play.style.width = `${viewW}px`
  play.style.height = `${viewH}px`
  play.style.minWidth = '0'
  play.style.minHeight = '0'
  play.style.maxWidth = `${viewW}px`
  play.style.maxHeight = `${viewH}px`
  play.classList.toggle('is-short', viewH <= 340)

  const width = Math.min(viewW, (viewH * 16) / 9)
  const height = (width * 9) / 16
  const stageW = Math.max(1, Math.round(width))
  const stageH = Math.max(1, Math.round(height))
  stage.style.width = `${stageW}px`
  stage.style.height = `${stageH}px`
  stage.style.maxWidth = `${viewW}px`
  stage.style.maxHeight = `${viewH}px`
  stage.style.minHeight = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
}

export function watchVisualViewport(onChange: () => void): () => void {
  const vv = window.visualViewport
  window.addEventListener('resize', onChange)
  window.addEventListener('orientationchange', onChange)
  vv?.addEventListener('resize', onChange)
  vv?.addEventListener('scroll', onChange)
  onChange()
  return () => {
    window.removeEventListener('resize', onChange)
    window.removeEventListener('orientationchange', onChange)
    vv?.removeEventListener('resize', onChange)
    vv?.removeEventListener('scroll', onChange)
  }
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
