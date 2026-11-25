import type { Action, Camera } from './types'
import { addHit, type Hit, INK } from './ui'
import type { ViewLayout } from './viewport'

const DIR_HIT = 64
const DIR_VIS = 54
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

export function layoutPad(layout: ViewLayout, camera: Camera, hasJump: boolean, hasAct: boolean): PadButton[] {
  const safe = layout.safe
  const insetL = INSET + safe.l
  const insetR = INSET + safe.r
  const insetB = INSET + safe.b
  const insetT = INSET + safe.t
  const four = camera === 'top'
  const buttons: PadButton[] = []

  const pause: PadButton = {
    id: 'pause',
    action: 'pause',
    cx: layout.sceneX + PAUSE_HIT / 2 + 8,
    cy: layout.sceneY + PAUSE_HIT / 2 + 8,
    hit: PAUSE_HIT,
    vis: PAUSE_VIS,
    round: false,
  }
  if (pause.cx - pause.hit / 2 < insetL) pause.cx = insetL + pause.hit / 2
  if (pause.cy - pause.hit / 2 < insetT) pause.cy = insetT + pause.hit / 2
  buttons.push(pause)

  const crossW = four ? DIR_VIS * 3 + GAP * 2 : DIR_VIS * 2 + GAP
  const crossH = four ? DIR_VIS * 3 + GAP * 2 : DIR_VIS
  let originX = 0
  let originY = 0

  if (layout.mode === 'sidebars') {
    originX = insetL + (four ? DIR_HIT * 1.5 + GAP : DIR_HIT + GAP / 2)
    originY = layout.viewH - insetB - (four ? DIR_HIT * 1.5 + GAP : DIR_HIT / 2)
    if (originX + crossW / 2 > layout.sceneX - 6) originX = Math.max(insetL + crossW / 2, layout.leftBar / 2)
  } else if (layout.mode === 'deck') {
    const deckTop = layout.sceneY + layout.sceneH
    originX = insetL + (four ? DIR_HIT * 1.5 + GAP : DIR_HIT + GAP / 2)
    originY = deckTop + (layout.deckH - insetB) / 2
  } else {
    originX = layout.sceneX + insetL + (four ? crossW / 2 : crossW / 2)
    originY = layout.sceneY + layout.sceneH - insetB - (four ? crossH / 2 : DIR_HIT / 2)
    originX = Math.max(originX, insetL + (four ? DIR_HIT * 1.5 : DIR_HIT))
    originY = Math.min(originY, layout.viewH - insetB - (four ? DIR_HIT * 1.5 : DIR_HIT / 2))
  }

  const placeDir = (action: Action, dx: number, dy: number): void => {
    buttons.push({
      id: action,
      action,
      cx: originX + dx * (DIR_VIS + GAP),
      cy: originY + dy * (DIR_VIS + GAP),
      hit: DIR_HIT,
      vis: DIR_VIS,
      round: false,
    })
  }

  placeDir('moveLeft', four ? -1 : -0.5, 0)
  placeDir('moveRight', four ? 1 : 0.5, 0)
  if (four) {
    placeDir('moveUp', 0, -1)
    placeDir('moveDown', 0, 1)
  }

  const actionCount = (hasJump ? 1 : 0) + (hasAct ? 1 : 0)
  let ax = layout.viewW - insetR - ACT_HIT / 2
  let ay = originY
  if (layout.mode === 'sidebars') {
    ax = layout.viewW - insetR - ACT_HIT / 2
    ay = layout.viewH - insetB - ACT_HIT / 2
  } else if (layout.mode === 'overlay') {
    ax = layout.sceneX + layout.sceneW - insetR - ACT_HIT / 2
    ay = layout.sceneY + layout.sceneH - insetB - ACT_HIT / 2
    ax = Math.min(ax, layout.viewW - insetR - ACT_HIT / 2)
  } else {
    ax = layout.viewW - insetR - ACT_HIT / 2
    ay = originY
  }

  if (hasJump && hasAct) {
    buttons.push({
      id: hasJump ? 'jump' : 'brake',
      action: 'jump',
      cx: ax - (ACT_HIT + 8),
      cy: ay,
      hit: ACT_HIT,
      vis: ACT_VIS,
      round: true,
    })
    buttons.push({ id: 'interact', action: 'interact', cx: ax, cy: ay, hit: ACT_HIT, vis: ACT_VIS, round: true })
  } else if (hasJump) {
    const action: Action = 'jump'
    buttons.push({ id: action, action, cx: ax, cy: ay, hit: ACT_HIT, vis: ACT_VIS, round: true })
  } else if (hasAct) {
    buttons.push({ id: 'interact', action: 'interact', cx: ax, cy: ay, hit: ACT_HIT, vis: ACT_VIS, round: true })
  } else if (actionCount === 0) {
    /* side-view walk only */
  }

  return buttons
}

export function remapBrake(buttons: PadButton[], hasBrake: boolean): PadButton[] {
  if (!hasBrake) return buttons
  return buttons.map((b) => (b.action === 'jump' ? { ...b, id: 'brake', action: 'brake' } : b))
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
    const fillA = on ? 0.48 : idle ? 0.17 : 0.22
    const strokeA = on ? 0.92 : idle ? 0.45 : 0.55
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
  } else if (action === 'jump' || action === 'brake') {
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

export { DIR_HIT, ACT_HIT, PAUSE_HIT, INK }
