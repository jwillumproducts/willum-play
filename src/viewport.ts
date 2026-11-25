import { VIEW_H, VIEW_W } from './world'

export const SCENE_W = VIEW_W
export const SCENE_H = VIEW_H
export const BAR_MIN = 180
export const SHRINK_MAX = 0.15
export const THUMB_CSS = 200

export type PadMode = 'sidebars' | 'deck' | 'overlay'

export interface SafeArea {
  t: number
  r: number
  b: number
  l: number
}

export interface PadNeed {
  left: number
  right: number
  deck: number
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
  fillView: boolean
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
  if (vv && positive(vv.width, 0) > 0 && positive(vv.height, 0) > 0) {
    return {
      left: vv.offsetLeft || 0,
      top: vv.offsetTop || 0,
      width: vv.width,
      height: vv.height,
    }
  }
  const innerW = positive(window.innerWidth, 1)
  const innerH = positive(window.innerHeight, 1)
  return { left: 0, top: 0, width: innerW, height: innerH }
}

export function safeArea(): SafeArea {
  return {
    t: Math.max(0, readPx('--sat')),
    r: Math.max(0, readPx('--sar')),
    b: Math.max(0, readPx('--sab')),
    l: Math.max(0, readPx('--sal')),
  }
}

export function computeLayout(fillView = false, need: PadNeed = { left: 0, right: 0, deck: 0 }): ViewLayout {
  const box = visualBox()
  const safe = safeArea()
  const dpr = Math.min(3, window.devicePixelRatio || 1)
  const portrait = box.height > box.width
  const phone = Math.min(box.width, box.height) < 600

  if (fillView) {
    return {
      left: box.left,
      top: box.top,
      viewW: box.width,
      viewH: box.height,
      dpr,
      safe,
      scale: Math.min(box.width / SCENE_W, box.height / SCENE_H),
      sceneX: 0,
      sceneY: 0,
      sceneW: box.width,
      sceneH: box.height,
      mode: 'overlay',
      leftBar: 0,
      rightBar: 0,
      deckH: 0,
      portrait,
      phone,
      fillView: true,
    }
  }

  const edge = 4
  const x0 = safe.l + edge
  const y0 = safe.t + edge
  const aw = Math.max(1, box.width - safe.l - safe.r - edge * 2)
  const ah = Math.max(1, box.height - safe.t - safe.b - edge * 2)
  const contain = Math.min(aw / SCENE_W, ah / SCENE_H)
  const minScale = contain * (1 - SHRINK_MAX)
  const bar = Math.max(0, need.left, need.right)
  const needL = bar
  const needSum = bar * 2
  const needDeck = Math.max(0, need.deck, bar)

  let scale = contain
  let mode: PadMode = 'overlay'

  const sideAt = (s: number): number => aw - SCENE_W * s
  const vertAt = (s: number): number => ah - SCENE_H * s

  if (needSum > 0 && sideAt(contain) >= needSum) {
    mode = 'sidebars'
    scale = contain
  } else if (needDeck > 0 && vertAt(contain) >= needDeck) {
    mode = 'deck'
    scale = contain
  } else if (needSum > 0) {
    const scaleBars = (aw - needSum) / SCENE_W
    if (scaleBars >= minScale && scaleBars > 0 && SCENE_H * Math.min(contain, scaleBars) <= ah) {
      scale = Math.min(contain, scaleBars)
      mode = 'sidebars'
    } else {
      const scaleDeck = (ah - needDeck) / SCENE_H
      if (needDeck > 0 && scaleDeck >= minScale && scaleDeck > 0 && SCENE_W * Math.min(contain, scaleDeck) <= aw) {
        scale = Math.min(contain, scaleDeck)
        mode = 'deck'
      } else {
        mode = 'overlay'
        scale = contain
      }
    }
  } else {
    mode = 'overlay'
    scale = contain
  }

  const sceneW = SCENE_W * scale
  const sceneH = SCENE_H * scale
  const extraX = Math.max(0, aw - sceneW)
  const extraY = Math.max(0, ah - sceneH)
  let sceneX = x0 + extraX / 2
  let sceneY = y0 + extraY / 2
  if (mode === 'sidebars') {
    const rest = Math.max(0, extraX - needSum)
    sceneX = x0 + needL + rest / 2
  } else if (mode === 'deck') {
    sceneY = y0
  }

  return {
    left: box.left,
    top: box.top,
    viewW: box.width,
    viewH: box.height,
    dpr,
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
    portrait,
    phone,
    fillView: false,
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
