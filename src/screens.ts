import { BRAND, fill, type Copy, type Locale } from './copy'
import { drawHenMark, drawCarMark } from './draw'
import { GAMES, type MiniGame } from './games'
import type { DeviceChoice, GameId, LevelId } from './types'
import {
  ACCENT,
  CREAM,
  HEAD_PT,
  INK,
  LINE,
  MUTED,
  PEACH,
  SAND,
  TAP_PT,
  TEXT_PT,
  addHit,
  drawButton,
  drawFlags,
  drawText,
  drawWrapped,
  fillRound,
  type Hit,
} from './ui'
import type { ViewLayout } from './viewport'

const markHen = document.createElement('canvas')
const markCar = document.createElement('canvas')
let marksReady = false

function ensureMarks(): void {
  if (marksReady) return
  markHen.width = 220
  markHen.height = 160
  markCar.width = 220
  markCar.height = 160
  const h = markHen.getContext('2d')
  const c = markCar.getContext('2d')
  if (h) drawHenMark(h, 220, 160)
  if (c) drawCarMark(c, 220, 160)
  marksReady = true
}

export interface ScreenState {
  copy: Copy
  locale: Locale
  device: DeviceChoice | null
  muted: boolean
  lastGame: GameId | null
  lastLevel: LevelId | null
  pressed: string | null
  scroll: number
  padStatus: string
}

export function clampScroll(scroll: number, max: number): number {
  return Math.min(Math.max(0, scroll), Math.max(0, max))
}

export function drawIntro(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): number {
  const { viewW: w, viewH: h, safe } = layout
  const pad = 16
  const x = pad + safe.l
  const maxW = w - pad * 2 - safe.l - safe.r
  let y = pad + safe.t + 8
  drawText(ctx, BRAND, w / 2, y + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  y += HEAD_PT + 12
  y += drawFlags(ctx, hits, x, y, maxW, state.locale, state.pressed) + 10
  y += drawWrapped(ctx, state.copy.intro[0], w / 2, y + 8, Math.min(560, maxW), TEXT_PT, 'center', INK) + 12

  const short = h < 430
  if (!short) {
    ensureMarks()
    const artW = Math.min(190, maxW * 0.38)
    const artH = artW * (160 / 220)
    ctx.drawImage(markHen, w / 2 - artW - 16, y, artW, artH)
    ctx.drawImage(markCar, w / 2 + 16, y, artW, artH)
    drawText(ctx, state.copy.hen, w / 2 - artW / 2 - 16, y + artH + 14, TEXT_PT, 'center', INK, 700)
    drawText(ctx, state.copy.car, w / 2 + artW / 2 + 16, y + artH + 14, TEXT_PT, 'center', INK, 700)
    y += artH + 36
    if (h > 560) {
      fillRound(ctx, x + (maxW - Math.min(560, maxW)) / 2, y, Math.min(560, maxW), 88, 18, CREAM, LINE, 3)
      y += 16
      y += drawWrapped(ctx, state.copy.intro[1], w / 2, y, Math.min(520, maxW - 24), TEXT_PT, 'center', MUTED)
      y += 16
    }
  }

  const ctaY = Math.min(y + 8, h - safe.b - TAP_PT - 28)
  drawButton(
    ctx,
    hits,
    'cta-device',
    x,
    ctaY,
    maxW,
    TAP_PT,
    state.copy.chooseDevice,
    short ? undefined : state.copy.chooseDeviceNote,
    state.pressed === 'cta-device',
  )
  return 0
}

export function drawDevice(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): number {
  const { viewW: w, viewH: h, safe } = layout
  const pad = 16
  const x = pad + safe.l
  const maxW = w - pad * 2 - safe.l - safe.r
  let y = pad + safe.t + 6
  drawText(ctx, BRAND, w / 2, y + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  y += HEAD_PT + 8
  y += drawFlags(ctx, hits, x, y, maxW, state.locale, state.pressed) + 8
  if (h >= 400) y += drawWrapped(ctx, state.copy.deviceLead, w / 2, y + 6, maxW, TEXT_PT, 'center', INK) + 14
  const gap = 10
  const btnH = TAP_PT
  const cols = maxW >= 3 * TAP_PT + 2 * gap ? 3 : h < 500 ? 2 : 1
  const items: { id: string; title: string; note: string; current: boolean }[] = [
    {
      id: 'dev-computer',
      title: state.copy.computer,
      note: state.device === 'computer' ? state.copy.chosenKeyboard : state.copy.keyboard,
      current: state.device === 'computer',
    },
    {
      id: 'dev-controller',
      title: state.copy.controller,
      note: state.device === 'controller' ? fill(state.copy.chosenNamed, state.copy.padOr) : state.copy.padOr,
      current: state.device === 'controller',
    },
    {
      id: 'dev-tablet',
      title: state.copy.tablet,
      note: state.device === 'tablet' ? state.copy.chosenTouch : state.copy.touch,
      current: state.device === 'tablet',
    },
  ]
  items.forEach((item, i) => {
    const col = cols === 1 ? 0 : i % cols
    const row = cols === 1 ? i : Math.floor(i / cols)
    const bw = cols === 1 ? maxW : (maxW - gap * (cols - 1)) / cols
    const bx = x + col * (bw + gap)
    const by = y + row * (btnH + gap)
    drawButton(
      ctx,
      hits,
      item.id,
      bx,
      by,
      bw,
      btnH,
      item.title,
      h < 400 || cols > 1 ? undefined : item.note,
      state.pressed === item.id,
      item.current,
    )
  })
  const rows = Math.ceil(items.length / cols)
  y += rows * (btnH + gap) + 4
  drawButton(ctx, hits, 'open-settings', x, Math.min(y, h - safe.b - TAP_PT - 8), maxW, TAP_PT, state.copy.settings, undefined, state.pressed === 'open-settings')
  return 0
}

export function drawPicker(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): number {
  const { viewW: w, viewH: h, safe, portrait } = layout
  const x0 = 12 + safe.l
  const maxW = w - 12 - safe.l - 12 - safe.r
  const gap = 8
  const fourFit = maxW >= 4 * TAP_PT + 3 * gap + 88
  const cols = portrait || !fourFit ? 2 : 4
  const short = h < 400
  const headerH = cols === 4 ? TAP_PT : portrait ? 56 : 48
  const innerW = maxW - (cols === 4 ? 88 : 0)
  const cardW = Math.max(TAP_PT, cols === 4 ? (innerW - gap * (cols - 1)) / cols : (maxW - gap) / 2)
  const cardH = Math.max(TAP_PT, portrait ? 88 : TAP_PT)
  let content = 0
  GAMES.forEach(() => {
    content += cols === 4 ? cardH + 12 : headerH + 8 + Math.ceil(4 / cols) * (cardH + gap) + 10
  })
  const top = 10 + safe.t
  const showLead = !short
  const titleBlock = HEAD_PT + (showLead ? TEXT_PT + 18 : 10)
  const viewTop = top + titleBlock
  const viewBot = h - safe.b - TAP_PT - 10
  const viewHgt = Math.max(80, viewBot - viewTop)
  const maxScroll = Math.max(0, content - viewHgt)
  const scroll = clampScroll(state.scroll, maxScroll)

  drawText(ctx, state.copy.chooseLevel, w / 2, top + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  if (showLead) {
    drawText(
      ctx,
      state.device === 'computer' ? state.copy.practiceKey : state.copy.practicePad,
      w / 2,
      top + HEAD_PT + 12,
      TEXT_PT,
      'center',
      MUTED,
      600,
    )
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, viewTop, w, viewHgt)
  ctx.clip()

  ensureMarks()
  let y = viewTop - scroll
  GAMES.forEach((mini) => {
    const label = mini.id === 'hen' ? state.copy.hen : state.copy.car
    if (cols === 4) {
      fillRound(ctx, x0, y, 80, cardH, 16, CREAM, LINE, 3)
      ctx.drawImage(mini.id === 'hen' ? markHen : markCar, x0 + 8, y + 6, 64, 40)
      drawText(ctx, label, x0 + 40, y + cardH - 12, TEXT_PT, 'center', INK, 700)
      drawLevelRow(ctx, hits, state, mini, x0 + 88, y, cardW, cardH, cols, gap)
      y += cardH + 12
    } else {
      fillRound(ctx, x0, y, maxW, headerH, 16, CREAM, LINE, 3)
      ctx.drawImage(mini.id === 'hen' ? markHen : markCar, x0 + 8, y + 8, 48, 34)
      drawText(ctx, label, x0 + 64, y + headerH / 2, TEXT_PT, 'left', INK, 700)
      y += headerH + 8
      y += drawLevelRow(ctx, hits, state, mini, x0, y, cardW, cardH, cols, gap)
      y += 8
    }
  })
  ctx.restore()

  ctx.fillStyle = SAND
  ctx.fillRect(0, viewBot, w, h - viewBot)
  const footY = h - safe.b - TAP_PT - 8
  const footW = (maxW - 8) / 2
  drawButton(ctx, hits, 'back-device', x0, footY, footW, TAP_PT, state.copy.switchDevice, undefined, state.pressed === 'back-device')
  drawButton(ctx, hits, 'open-settings', x0 + footW + 8, footY, footW, TAP_PT, state.copy.settings, undefined, state.pressed === 'open-settings')
  return maxScroll
}

function drawLevelRow(
  ctx: CanvasRenderingContext2D,
  hits: Hit[],
  state: ScreenState,
  mini: MiniGame,
  x: number,
  y: number,
  cardW: number,
  cardH: number,
  cols: number,
  gap: number,
): number {
  mini.levels.forEach((level, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const bx = x + col * (cardW + gap)
    const by = y + row * (cardH + gap)
    const id = `level-${mini.id}-${level.id}`
    const last = state.lastGame === mini.id && state.lastLevel === level.id
    const title = mini.id === 'hen' ? state.copy.henLevels[level.id - 1] : state.copy.carLevels[level.id - 1]
    fillRound(ctx, bx, by, cardW, cardH, 14, CREAM, last ? ACCENT : LINE, last ? 4 : 3)
    drawText(ctx, `${state.copy.levelWord} ${level.id}`, bx + cardW / 2, by + cardH * 0.32, TEXT_PT, 'center', MUTED, 600)
    drawText(ctx, title, bx + cardW / 2, by + cardH * 0.62, TEXT_PT + 2, 'center', INK, 750)
    addHit(hits, { id, x: bx, y: by, w: Math.max(TAP_PT, cardW), h: Math.max(TAP_PT, cardH), fontPt: TEXT_PT + 2 })
  })
  return Math.ceil(mini.levels.length / cols) * (cardH + gap)
}

export function drawPause(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): void {
  dim(ctx, layout)
  const short = layout.viewH < 500
  const w = Math.min(layout.viewW - 24, short ? 560 : 420)
  const cols = short ? 2 : 1
  const btnH = TAP_PT
  const gap = 10
  const inner = 16
  const titleH = HEAD_PT + 8
  const rows = short ? 2 : 4
  const h = titleH + inner * 2 + rows * btnH + (rows - 1) * gap
  const x = (layout.viewW - w) / 2
  const y = Math.max(layout.safe.t + 8, (layout.viewH - h) / 2)
  fillRound(ctx, x, y, w, h, 22, CREAM, LINE, 3)
  drawText(ctx, state.copy.pause, x + w / 2, y + inner + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  const items = [
    { id: 'resume', title: state.copy.resume },
    { id: 'to-menu', title: state.copy.switchLevel },
    { id: 'pause-sound', title: state.muted ? state.copy.soundOn : state.copy.soundOff },
    { id: 'open-settings', title: state.copy.settings },
  ]
  items.forEach((item, i) => {
    const col = cols === 2 ? i % 2 : 0
    const row = cols === 2 ? Math.floor(i / 2) : i
    const bw = cols === 2 ? (w - inner * 2 - gap) / 2 : w - inner * 2
    const bx = x + inner + col * (bw + gap)
    const by = y + inner + titleH + row * (btnH + gap)
    if (item.id === 'pause-sound') {
      fillRound(ctx, bx, by, bw, btnH, 16, CREAM, LINE, 3)
      speaker(ctx, bx + bw / 2, by + btnH / 2, 16, state.muted)
      addHit(hits, { id: item.id, x: bx, y: by, w: bw, h: btnH, fontPt: TEXT_PT })
    } else {
      drawButton(ctx, hits, item.id, bx, by, bw, btnH, item.title, undefined, state.pressed === item.id)
    }
  })
}

export function drawSettings(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): void {
  dim(ctx, layout)
  const short = layout.viewH < 500
  const w = Math.min(layout.viewW - 24, short ? 600 : 440)
  const inner = 14
  const btnH = TAP_PT
  const h = Math.min(layout.viewH - 16, short ? layout.viewH - 20 : 520)
  const x = (layout.viewW - w) / 2
  const y = Math.max(8, (layout.viewH - h) / 2)
  fillRound(ctx, x, y, w, h, 22, CREAM, LINE, 3)
  let cy = y + inner + HEAD_PT / 2
  drawText(ctx, state.copy.settings, x + w / 2, cy, HEAD_PT, 'center', INK, 800)
  cy += HEAD_PT / 2 + 8
  drawText(ctx, state.copy.language, x + w / 2, cy + 8, TEXT_PT, 'center', MUTED, 600)
  cy += 18
  cy += drawFlags(ctx, hits, x + inner, cy, w - inner * 2, state.locale, state.pressed) + 10
  const cols = short ? 2 : 1
  const items = [
    { id: 'set-sound', title: state.muted ? state.copy.soundOn : state.copy.soundOff },
    { id: 'set-device', title: state.copy.switchDevice },
    { id: 'set-about', title: state.copy.about },
    { id: 'set-close', title: state.copy.cancel },
  ]
  items.forEach((item, i) => {
    const col = cols === 2 ? i % 2 : 0
    const row = cols === 2 ? Math.floor(i / 2) : i
    const bw = cols === 2 ? (w - inner * 2 - 10) / 2 : w - inner * 2
    const bx = x + inner + col * (bw + 10)
    const by = cy + row * (btnH + 8)
    if (item.id === 'set-sound') {
      fillRound(ctx, bx, by, bw, btnH, 16, CREAM, LINE, 3)
      speaker(ctx, bx + bw / 2, by + btnH / 2, 16, state.muted)
      addHit(hits, { id: item.id, x: bx, y: by, w: bw, h: btnH, fontPt: TEXT_PT })
    } else {
      drawButton(ctx, hits, item.id, bx, by, bw, btnH, item.title, undefined, state.pressed === item.id)
    }
  })
}

export function drawPadWait(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): void {
  dim(ctx, layout)
  const w = Math.min(layout.viewW - 24, 440)
  const h = 240
  const x = (layout.viewW - w) / 2
  const y = (layout.viewH - h) / 2
  fillRound(ctx, x, y, w, h, 22, CREAM, LINE, 3)
  drawText(ctx, state.copy.controller, x + w / 2, y + 36, HEAD_PT, 'center', INK, 800)
  drawWrapped(ctx, state.padStatus || state.copy.padLogo, x + w / 2, y + 70, w - 32, TEXT_PT, 'center', MUTED)
  drawButton(ctx, hits, 'pad-cancel', x + 16, y + h - TAP_PT - 16, w - 32, TAP_PT, state.copy.cancel, undefined, state.pressed === 'pad-cancel')
}

export function drawRotate(ctx: CanvasRenderingContext2D, layout: ViewLayout, copy: Copy): void {
  const w = Math.min(layout.viewW - 24, 420)
  const x = (layout.viewW - w) / 2
  const y = layout.safe.t + 10
  fillRound(ctx, x, y, w, 88, 18, 'rgba(246, 226, 196, 0.96)', LINE, 3)
  drawText(ctx, copy.turnPhone, x + w / 2, y + 32, HEAD_PT, 'center', INK, 800)
  drawText(ctx, copy.turnPhoneHint, x + w / 2, y + 62, TEXT_PT, 'center', MUTED, 600)
}

export function drawLetterbox(ctx: CanvasRenderingContext2D, layout: ViewLayout): void {
  ctx.fillStyle = SAND
  ctx.fillRect(0, 0, layout.viewW, layout.viewH)
  ctx.fillStyle = PEACH
  ctx.fillRect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
}

function dim(ctx: CanvasRenderingContext2D, layout: ViewLayout): void {
  ctx.fillStyle = 'rgba(92, 59, 50, 0.28)'
  ctx.fillRect(0, 0, layout.viewW, layout.viewH)
}

function speaker(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, muted: boolean): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.moveTo(-s * 0.4, -s * 0.2)
  ctx.lineTo(-s * 0.05, -s * 0.2)
  ctx.lineTo(s * 0.35, -s * 0.55)
  ctx.lineTo(s * 0.35, s * 0.55)
  ctx.lineTo(-s * 0.05, s * 0.2)
  ctx.lineTo(-s * 0.4, s * 0.2)
  ctx.closePath()
  ctx.fill()
  if (muted) {
    ctx.strokeStyle = INK
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-s * 0.5, -s * 0.5)
    ctx.lineTo(s * 0.55, s * 0.5)
    ctx.stroke()
  } else {
    ctx.strokeStyle = INK
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.arc(s * 0.2, 0, s * 0.35, -0.7, 0.7)
    ctx.stroke()
  }
  ctx.restore()
}
