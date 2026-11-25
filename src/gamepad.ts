import type { Action } from './types'
import { addHit, type Hit } from './ui'
import type { PadNeed, ViewLayout } from './viewport'

const DIR_HIT = 64
const DIR_VIS = 52
const ACT_HIT = 84
const ACT_VIS = 72
const GAP = 4
const INSET = 6
const PAUSE_HIT = 44
const PAUSE_VIS = 36

const FACES: Action[] = ['jump', 'brake', 'interact']

export interface PadButton {
  id: Action | 'pause'
  action: Action | 'pause'
  cx: number
  cy: number
  hit: number
  vis: number
  round: boolean
}

export interface PadRect {
  x: number
  y: number
  w: number
  h: number
}

export interface PadSlots {
  originX: number
  originY: number
  pause: { cx: number; cy: number }
  action: { cx: number; cy: number }
  dpad: PadRect
  actionRect: PadRect
}

export function maxPadNeed(): PadNeed {
  const dpad = INSET * 2 + DIR_HIT + 2 * (DIR_VIS + GAP)
  const action = INSET * 2 + ACT_HIT
  const bar = Math.max(dpad, action)
  return { left: bar, right: bar, deck: bar }
}

export function padSlots(layout: ViewLayout): PadSlots {
  const insetL = INSET + layout.safe.l
  const insetR = INSET + layout.safe.r
  const insetB = INSET + layout.safe.b
  const insetT = INSET + layout.safe.t
  const step = DIR_VIS + GAP
  const pause = { cx: insetL + PAUSE_HIT / 2, cy: insetT + PAUSE_HIT / 2 }

  let originX = insetL + DIR_HIT + step / 2
  let originY = layout.viewH - insetB - DIR_HIT - step / 2
  if (layout.mode === 'sidebars') {
    originX = clamp(layout.leftBar / 2, DIR_HIT / 2 + step, Math.max(DIR_HIT / 2 + step, layout.sceneX - step - DIR_HIT / 2))
    originY = layout.viewH - insetB - DIR_HIT - step / 2
  } else if (layout.mode === 'deck') {
    originY = layout.sceneY + layout.sceneH + Math.max(DIR_HIT + step / 2, (layout.deckH - insetB) / 2)
  }
  originX = clamp(originX, DIR_HIT / 2 + step, layout.viewW - DIR_HIT / 2 - step)
  originY = clamp(originY, DIR_HIT / 2 + step, layout.viewH - DIR_HIT / 2 - step)

  const leftX = originX - step
  const rightX = originX + step
  const upY = originY - step
  const downY = originY + step
  const dpad: PadRect = {
    x: leftX - DIR_HIT / 2,
    y: upY - DIR_HIT / 2,
    w: rightX - leftX + DIR_HIT,
    h: downY - upY + DIR_HIT,
  }

  let ax = layout.viewW - insetR - ACT_HIT / 2
  let ay = layout.viewH - insetB - ACT_HIT / 2
  if (layout.mode === 'sidebars') {
    ax = clampBar(layout.sceneX + layout.sceneW + layout.rightBar / 2, ACT_HIT, layout, 'right')
    ay = layout.viewH - insetB - ACT_HIT / 2
  } else if (layout.mode === 'deck') {
    ay = originY
  }
  ax = clamp(ax, ACT_HIT / 2, layout.viewW - ACT_HIT / 2)
  ay = clamp(ay, ACT_HIT / 2, layout.viewH - ACT_HIT / 2)

  return {
    originX,
    originY,
    pause,
    action: { cx: ax, cy: ay },
    dpad,
    actionRect: { x: ax - ACT_HIT / 2, y: ay - ACT_HIT / 2, w: ACT_HIT, h: ACT_HIT },
  }
}

export function layoutPad(layout: ViewLayout, actions: readonly Action[]): PadButton[] {
  const set = new Set(actions)
  const slots = padSlots(layout)
  const step = DIR_VIS + GAP
  const buttons: PadButton[] = [
    {
      id: 'pause',
      action: 'pause',
      cx: slots.pause.cx,
      cy: slots.pause.cy,
      hit: PAUSE_HIT,
      vis: PAUSE_VIS,
      round: false,
    },
  ]
  const dirAt = (action: Action, dx: number, dy: number): void => {
    buttons.push({
      id: action,
      action,
      cx: slots.originX + dx * step,
      cy: slots.originY + dy * step,
      hit: DIR_HIT,
      vis: DIR_VIS,
      round: false,
    })
  }
  if (set.has('moveLeft')) dirAt('moveLeft', -1, 0)
  if (set.has('moveRight')) dirAt('moveRight', 1, 0)
  if (set.has('moveUp')) dirAt('moveUp', 0, -1)
  if (set.has('moveDown')) dirAt('moveDown', 0, 1)

  const face = FACES.find((action) => set.has(action))
  if (face) {
    buttons.push({
      id: face,
      action: face,
      cx: slots.action.cx,
      cy: slots.action.cy,
      hit: ACT_HIT,
      vis: ACT_VIS,
      round: true,
    })
  }
  return buttons.map((button) => clampHit(button, layout))
}

function clampBar(cx: number, hit: number, layout: ViewLayout, side: 'left' | 'right'): number {
  if (layout.mode !== 'sidebars') {
    return clamp(cx, hit / 2, layout.viewW - hit / 2)
  }
  if (side === 'left') {
    const max = layout.sceneX - hit / 2
    return clamp(cx, hit / 2, Math.max(hit / 2, max))
  }
  const min = layout.sceneX + layout.sceneW + hit / 2
  return clamp(cx, Math.min(min, layout.viewW - hit / 2), layout.viewW - hit / 2)
}

function clampHit(button: PadButton, layout: ViewLayout): PadButton {
  const half = button.hit / 2
  let cx = clamp(button.cx, half, layout.viewW - half)
  let cy = clamp(button.cy, half, layout.viewH - half)
  if (layout.mode === 'sidebars' && button.action !== 'pause') {
    const left = button.action.startsWith('move')
    if (left) cx = Math.min(cx, layout.sceneX - half)
    else cx = Math.max(cx, layout.sceneX + layout.sceneW + half)
    cx = clamp(cx, half, layout.viewW - half)
  }
  return { ...button, cx, cy }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function drawPad(
  ctx: CanvasRenderingContext2D,
  hits: Hit[],
  buttons: PadButton[],
  held: Set<string>,
  idle: boolean,
  now: number,
): void {
  for (const b of buttons) {
    const on = held.has(b.action)
    const fillA = on ? 0.36 : idle ? 0.18 : 0.22
    const strokeA = on ? 0.7 : idle ? 0.5 : 0.58
    const scale = on ? 1.07 : 1
    const vis = b.vis * scale
    ctx.save()
    ctx.translate(b.cx, b.cy)
    if (on) {
      ctx.shadowColor = 'rgba(255, 224, 130, 0.55)'
      ctx.shadowBlur = 18
    }
    ctx.beginPath()
    if (b.round || b.action === 'jump' || b.action === 'brake' || b.action === 'interact') {
      ctx.arc(0, 0, vis / 2, 0, Math.PI * 2)
    } else {
      const r = 12
      const s = vis / 2
      rounded(ctx, -s, -s, vis, vis, r)
    }
    ctx.fillStyle = `rgba(255, 250, 243, ${fillA})`
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = `rgba(92, 59, 50, ${strokeA})`
    ctx.lineWidth = 1.8
    ctx.stroke()
    ctx.fillStyle = `rgba(92, 59, 50, ${on ? 0.95 : 0.7})`
    icon(ctx, b.action, vis * 0.42)
    ctx.restore()
    addHit(hits, {
      id: `pad-${b.action}`,
      x: b.cx - b.hit / 2,
      y: b.cy - b.hit / 2,
      w: b.hit,
      h: b.hit,
    })
  }
  void now
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function icon(ctx: CanvasRenderingContext2D, action: Action | 'pause', size: number): void {
  ctx.save()
  ctx.strokeStyle = ctx.fillStyle as string
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(3, size * 0.18)
  if (action === 'pause') {
    const w = size * 0.22
    const h = size * 0.7
    ctx.fillRect(-size * 0.32, -h / 2, w, h)
    ctx.fillRect(size * 0.1, -h / 2, w, h)
  } else if (action === 'jump') {
    ctx.beginPath()
    ctx.moveTo(-size * 0.32, size * 0.12)
    ctx.lineTo(0, -size * 0.32)
    ctx.lineTo(size * 0.32, size * 0.12)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -size * 0.32)
    ctx.lineTo(0, size * 0.34)
    ctx.stroke()
  } else if (action === 'brake') {
    ctx.beginPath()
    ctx.moveTo(-size * 0.42, size * 0.08)
    ctx.lineTo(size * 0.42, size * 0.08)
    ctx.stroke()
  } else if (action === 'interact') {
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-size * 0.12, 0)
    ctx.lineTo(size * 0.2, 0)
    ctx.lineTo(size * 0.02, -size * 0.16)
    ctx.moveTo(size * 0.2, 0)
    ctx.lineTo(size * 0.02, size * 0.16)
    ctx.stroke()
  } else {
    const a =
      action === 'moveLeft' ? Math.PI : action === 'moveRight' ? 0 : action === 'moveUp' ? -Math.PI / 2 : Math.PI / 2
    ctx.rotate(a)
    ctx.beginPath()
    ctx.moveTo(size * 0.28, 0)
    ctx.lineTo(-size * 0.18, -size * 0.28)
    ctx.lineTo(-size * 0.18, size * 0.28)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export function padAt(buttons: PadButton[], x: number, y: number): PadButton | null {
  let best: PadButton | null = null
  let bestD = Infinity
  for (const b of buttons) {
    const d = Math.hypot(x - b.cx, y - b.cy)
    if (d <= b.hit / 2 && d < bestD) {
      best = b
      bestD = d
    }
  }
  return best
}

export { DIR_HIT, ACT_HIT, PAUSE_HIT, GAP }
