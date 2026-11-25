import { VIEW_H, VIEW_W } from './world'

export const SCENE_W = VIEW_W
export const SCENE_H = VIEW_H
export const BAR_MIN = 176
export const SHRINK_MAX = 0.15
export const THUMB_CSS = 200

export type PadMode = 'sidebars' | 'deck' | 'overlay'

export interface SafeArea {
  t: number
  r: number
  b: number
  l: number
}

export interface ViewLayout {
  left: number
  top: number
  viewW: number
  viewH: number
  dpr: number
  safe: SafeArea
  scale: number
  sceneX: number
  sceneY: number
  sceneW: number
  sceneH: number
  mode: PadMode
  leftBar: number
  rightBar: number
  deckH: number
  portrait: boolean
  phone: boolean
}

function positive(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function readPx(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

export function visualBox(): { left: number; top: number; width: number; height: number } {
  const vv = window.visualViewport
  const innerW = positive(window.innerWidth, 1)
  const innerH = positive(window.innerHeight, 1)
  const clientW = positive(document.documentElement.clientWidth, innerW)
  const clientH = positive(document.documentElement.clientHeight, innerH)
  const vvW = positive(vv?.width, innerW)
  const vvH = positive(vv?.height, innerH)
  return {
    left: vv?.offsetLeft ?? 0,
    top: vv?.offsetTop ?? 0,
    width: Math.max(1, Math.min(vvW, innerW, clientW)),
    height: Math.max(1, Math.min(vvH, innerH, clientH)),
  }
}

export function safeArea(): SafeArea {
  return {
    t: Math.max(0, readPx('--sat')),
    r: Math.max(0, readPx('--sar')),
    b: Math.max(0, readPx('--sab')),
    l: Math.max(0, readPx('--sal')),
  }
}

export function computeLayout(): ViewLayout {
  const box = visualBox()
  const safe = safeArea()
  const edge = 4
  const x0 = safe.l + edge
  const y0 = safe.t + edge
  const aw = Math.max(1, box.width - safe.l - safe.r - edge * 2)
  const ah = Math.max(1, box.height - safe.t - safe.b - edge * 2)
  const contain = Math.min(aw / SCENE_W, ah / SCENE_H)
  const minScale = contain * (1 - SHRINK_MAX)

  let scale = contain
  let mode: PadMode = 'overlay'

  const sideAt = (s: number): number => (aw - SCENE_W * s) / 2
  const vertAt = (s: number): number => (ah - SCENE_H * s) / 2

  if (sideAt(contain) >= BAR_MIN) {
    mode = 'sidebars'
    scale = contain
  } else if (vertAt(contain) >= BAR_MIN) {
    mode = 'deck'
    scale = contain
  } else {
    const scaleBars = (aw - BAR_MIN * 2) / SCENE_W
    if (scaleBars >= minScale && scaleBars > 0 && SCENE_H * Math.min(contain, scaleBars) <= ah) {
      scale = Math.min(contain, scaleBars)
      mode = 'sidebars'
    } else {
      const scaleDeck = (ah - BAR_MIN) / SCENE_H
      if (scaleDeck >= minScale && scaleDeck > 0 && SCENE_W * Math.min(contain, scaleDeck) <= aw) {
        scale = Math.min(contain, scaleDeck)
        mode = 'deck'
      } else {
        mode = 'overlay'
        scale = contain
      }
    }
  }

  const sceneW = SCENE_W * scale
  const sceneH = SCENE_H * scale
  let sceneX = x0 + (aw - sceneW) / 2
  let sceneY = y0 + (ah - sceneH) / 2
  if (mode === 'deck') sceneY = y0
  if (mode === 'sidebars') sceneX = x0 + (aw - sceneW) / 2

  return {
    left: box.left,
    top: box.top,
    viewW: box.width,
    viewH: box.height,
    dpr: Math.min(3, window.devicePixelRatio || 1),
    safe,
    scale,
    sceneX,
    sceneY,
    sceneW,
    sceneH,
    mode,
    leftBar: sceneX,
    rightBar: box.width - (sceneX + sceneW),
    deckH: box.height - safe.b - (sceneY + sceneH),
    portrait: box.height > box.width,
    phone: Math.min(box.width, box.height) < 600,
  }
}

export function cssToScene(layout: ViewLayout, cssX: number, cssY: number): { x: number; y: number } {
  return {
    x: (cssX - layout.sceneX) / layout.scale,
    y: (cssY - layout.sceneY) / layout.scale,
  }
}

export function sceneToCss(layout: ViewLayout, x: number, y: number): { x: number; y: number } {
  return {
    x: layout.sceneX + x * layout.scale,
    y: layout.sceneY + y * layout.scale,
  }
}

export function watchView(onChange: () => void): () => void {
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
