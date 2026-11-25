import type { Action } from './types'
import { addHit, type Hit } from './ui'
import type { ViewLayout } from './viewport'

const DIR_HIT = 64
const DIR_VIS = 52
const ACT_HIT = 84
const ACT_VIS = 72
const GAP = 10
const INSET = 14
const PAUSE_HIT = 44
const PAUSE_VIS = 36

export interface PadButton {
  id: Action | 'pause'
  action: Action | 'pause'
  cx: number
  cy: number
  hit: number
  vis: number
  round: boolean
}

export function layoutPad(layout: ViewLayout, hasJump: boolean, hasBrake: boolean, hasAct: boolean): PadButton[] {
  const safe = layout.safe
  const insetL = INSET + safe.l
  const insetR = INSET + safe.r
  const insetB = INSET + safe.b
  const insetT = INSET + safe.t
  const buttons: PadButton[] = []
  const crossSpan = DIR_HIT * 3 + GAP * 2

  buttons.push({
    id: 'pause',
    action: 'pause',
    cx: insetL + PAUSE_HIT / 2,
    cy: insetT + PAUSE_HIT / 2,
    hit: PAUSE_HIT,
    vis: PAUSE_VIS,
    round: false,
  })

  let originX = insetL + DIR_HIT * 1.5 + GAP
  let originY = layout.viewH - insetB - DIR_HIT * 1.5 - GAP

  if (layout.mode === 'sidebars') {
    originX = Math.min(insetL + DIR_HIT * 1.5 + GAP, Math.max(insetL + DIR_HIT, layout.leftBar / 2))
    originY = layout.viewH - insetB - DIR_HIT * 1.5 - GAP
    if (originX + crossSpan / 2 > layout.sceneX) originX = Math.max(DIR_HIT * 1.5, layout.leftBar / 2)
  } else if (layout.mode === 'deck') {
    originX = insetL + DIR_HIT * 1.5 + GAP
    originY = layout.sceneY + layout.sceneH + Math.max(DIR_HIT * 1.5, (layout.deckH - insetB) / 2)
  } else {
    originX = insetL + DIR_HIT * 1.5 + GAP
    originY = layout.viewH - insetB - DIR_HIT * 1.5 - GAP
  }

  originX = clamp(originX, DIR_HIT, layout.viewW - DIR_HIT)
  originY = clamp(originY, DIR_HIT, layout.viewH - DIR_HIT)

  const placeDir = (action: Action, dx: number, dy: number): void => {
    buttons.push({
      id: action,
      action,
      cx: clamp(originX + dx * (DIR_VIS + GAP), DIR_HIT / 2, layout.viewW - DIR_HIT / 2),
      cy: clamp(originY + dy * (DIR_VIS + GAP), DIR_HIT / 2, layout.viewH - DIR_HIT / 2),
      hit: DIR_HIT,
      vis: DIR_VIS,
      round: false,
    })
  }

  placeDir('moveLeft', -1, 0)
  placeDir('moveRight', 1, 0)
  placeDir('moveUp', 0, -1)
  placeDir('moveDown', 0, 1)

  let ax = layout.viewW - insetR - ACT_HIT / 2
  let ay = layout.viewH - insetB - ACT_HIT / 2
  if (layout.mode === 'sidebars') {
    ax = layout.viewW - insetR - ACT_HIT / 2
    ay = layout.viewH - insetB - ACT_HIT / 2
  } else if (layout.mode === 'deck') {
    ay = originY
  }
  ax = clamp(ax, ACT_HIT / 2, layout.viewW - ACT_HIT / 2)
  ay = clamp(ay, ACT_HIT / 2, layout.viewH - ACT_HIT / 2)

  const face: Action = hasBrake ? 'brake' : 'jump'
  if (hasAct) {
    buttons.push({
      id: face,
      action: face,
      cx: ax - (ACT_HIT + 8),
      cy: ay,
      hit: ACT_HIT,
      vis: ACT_VIS,
      round: true,
    })
    buttons.push({ id: 'interact', action: 'interact', cx: ax, cy: ay, hit: ACT_HIT, vis: ACT_VIS, round: true })
  } else {
    buttons.push({ id: face, action: face, cx: ax, cy: ay, hit: ACT_HIT, vis: ACT_VIS, round: true })
  }
  void hasJump

  return buttons
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

export { DIR_HIT, ACT_HIT, PAUSE_HIT }
