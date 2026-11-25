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

interface Stage {
  x: number
  y: number
  w: number
  h: number
  cx: number
  bottom: number
}

function stage(layout: ViewLayout): Stage {
  const pad = 12
  const x = layout.sceneX + pad + layout.safe.l
  const y = layout.sceneY + pad + layout.safe.t
  const w = Math.max(64, layout.sceneW - pad * 2 - layout.safe.l - layout.safe.r)
  const h = Math.max(64, layout.sceneH - pad * 2 - layout.safe.t - layout.safe.b)
  return { x, y, w, h, cx: x + w / 2, bottom: y + h }
}

export function clampScroll(scroll: number, max: number): number {
  return Math.min(Math.max(0, scroll), Math.max(0, max))
}

export function drawIntro(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): number {
  const s = stage(layout)
  ctx.save()
  ctx.beginPath()
  ctx.rect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
  ctx.clip()

  let y = s.y
  drawText(ctx, BRAND, s.cx, y + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  y += HEAD_PT + 10
  y += drawFlags(ctx, hits, s.x, y, s.w, state.locale, state.pressed) + 8

  const ctaH = TAP_PT
  const ctaY = s.bottom - ctaH
  const room = ctaY - y
  const short = s.h < 500

  if (room > 48) {
    y += drawWrapped(ctx, state.copy.intro[0], s.cx, y + 6, Math.min(560, s.w), TEXT_PT, 'center', INK) + 10
  }

  if (!short && room > 180) {
    ensureMarks()
    const artW = Math.min(160, s.w * 0.36)
    const artH = artW * (160 / 220)
    if (y + artH + 28 < ctaY - 8) {
      ctx.drawImage(markHen, s.cx - artW - 12, y, artW, artH)
      ctx.drawImage(markCar, s.cx + 12, y, artW, artH)
      drawText(ctx, state.copy.hen, s.cx - artW / 2 - 12, y + artH + 14, TEXT_PT, 'center', INK, 700)
      drawText(ctx, state.copy.car, s.cx + artW / 2 + 12, y + artH + 14, TEXT_PT, 'center', INK, 700)
      y += artH + 32
    }
  }

  if (!short && s.h > 620 && y + 90 < ctaY) {
    const cardW = Math.min(560, s.w)
    fillRound(ctx, s.x + (s.w - cardW) / 2, y, cardW, Math.min(88, ctaY - y - 12), 18, CREAM, LINE, 3)
    drawWrapped(ctx, state.copy.intro[1], s.cx, y + 16, cardW - 24, TEXT_PT, 'center', MUTED)
  }

  drawButton(
    ctx,
    hits,
    'cta-device',
    s.x,
    ctaY,
    s.w,
    TAP_PT,
    state.copy.chooseDevice,
    short ? undefined : state.copy.chooseDeviceNote,
    state.pressed === 'cta-device',
  )
  ctx.restore()
  return 0
}

export function drawDevice(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): number {
  const s = stage(layout)
  ctx.save()
  ctx.beginPath()
  ctx.rect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
  ctx.clip()

  let y = s.y
  drawText(ctx, BRAND, s.cx, y + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  y += HEAD_PT + 8
  y += drawFlags(ctx, hits, s.x, y, s.w, state.locale, state.pressed) + 8
  if (s.h >= 420) y += drawWrapped(ctx, state.copy.deviceLead, s.cx, y + 6, s.w, TEXT_PT, 'center', INK) + 12

  const gap = 10
  const btnH = TAP_PT
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
  const minCol = 200
  const cols = layout.portrait || s.w < 3 * minCol + 2 * gap ? 1 : 3
  const settingsY = s.bottom - TAP_PT

  items.forEach((item, i) => {
    const col = cols === 1 ? 0 : i % cols
    const row = cols === 1 ? i : Math.floor(i / cols)
    const bw = cols === 1 ? s.w : (s.w - gap * (cols - 1)) / cols
    const bx = s.x + col * (bw + gap)
    const by = y + row * (btnH + gap)
    if (by + btnH > settingsY - 4) return
    drawButton(
      ctx,
      hits,
      item.id,
      bx,
      by,
      bw,
      btnH,
      item.title,
      s.h < 420 || cols > 1 ? undefined : item.note,
      state.pressed === item.id,
      item.current,
    )
  })

  drawButton(
    ctx,
    hits,
    'open-settings',
    s.x,
    settingsY,
    s.w,
    TAP_PT,
    state.copy.settings,
    undefined,
    state.pressed === 'open-settings',
  )
  ctx.restore()
  return 0
}

export function drawPicker(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): number {
  const s = stage(layout)
  const gap = 8
  const portrait = layout.portrait
  const fourFit = s.w >= 4 * TAP_PT + 3 * gap + 88
  const cols = portrait || !fourFit ? 2 : 4
  const short = s.h < 400
  const headerH = cols === 4 ? TAP_PT : portrait ? 56 : 48
  const innerW = s.w - (cols === 4 ? 88 : 0)
  const cardW = Math.max(TAP_PT, cols === 4 ? (innerW - gap * (cols - 1)) / cols : (s.w - gap) / 2)
  const cardH = Math.max(TAP_PT, portrait ? 88 : TAP_PT)
  let content = 0
  GAMES.forEach(() => {
    content += cols === 4 ? cardH + 12 : headerH + 8 + Math.ceil(4 / cols) * (cardH + gap) + 10
  })
  const showLead = !short
  const titleBlock = HEAD_PT + (showLead ? TEXT_PT + 16 : 8)
  const viewTop = s.y + titleBlock
  const viewBot = s.bottom - TAP_PT - 8
  const viewHgt = Math.max(80, viewBot - viewTop)
  const maxScroll = Math.max(0, content - viewHgt)
  const scroll = clampScroll(state.scroll, maxScroll)

  ctx.save()
  ctx.beginPath()
  ctx.rect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
  ctx.clip()

  drawText(ctx, state.copy.chooseLevel, s.cx, s.y + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  if (showLead) {
    drawText(
      ctx,
      state.device === 'computer' ? state.copy.practiceKey : state.copy.practicePad,
      s.cx,
      s.y + HEAD_PT + 12,
      TEXT_PT,
      'center',
      MUTED,
      600,
    )
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(layout.sceneX, viewTop, layout.sceneW, viewHgt)
  ctx.clip()

  ensureMarks()
  let y = viewTop - scroll
  GAMES.forEach((mini) => {
    const label = mini.id === 'hen' ? state.copy.hen : state.copy.car
    if (cols === 4) {
      fillRound(ctx, s.x, y, 80, cardH, 16, CREAM, LINE, 3)
      ctx.drawImage(mini.id === 'hen' ? markHen : markCar, s.x + 8, y + 6, 64, 40)
      drawText(ctx, label, s.x + 40, y + cardH - 12, TEXT_PT, 'center', INK, 700)
      drawLevelRow(ctx, hits, state, mini, s.x + 88, y, cardW, cardH, cols, gap)
      y += cardH + 12
    } else {
      fillRound(ctx, s.x, y, s.w, headerH, 16, CREAM, LINE, 3)
      ctx.drawImage(mini.id === 'hen' ? markHen : markCar, s.x + 8, y + 8, 48, 34)
      drawText(ctx, label, s.x + 64, y + headerH / 2, TEXT_PT, 'left', INK, 700)
      y += headerH + 8
      y += drawLevelRow(ctx, hits, state, mini, s.x, y, cardW, cardH, cols, gap)
      y += 8
    }
  })
  ctx.restore()

  ctx.fillStyle = layout.fillView ? PEACH : SAND
  ctx.fillRect(layout.sceneX, viewBot, layout.sceneW, layout.sceneY + layout.sceneH - viewBot)
  const footY = s.bottom - TAP_PT
  const footW = (s.w - 8) / 2
  drawButton(ctx, hits, 'back-device', s.x, footY, footW, TAP_PT, state.copy.switchDevice, undefined, state.pressed === 'back-device')
  drawButton(ctx, hits, 'open-settings', s.x + footW + 8, footY, footW, TAP_PT, state.copy.settings, undefined, state.pressed === 'open-settings')
  ctx.restore()
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

function panelBox(layout: ViewLayout, maxW: number, wantH: number): { x: number; y: number; w: number; h: number } {
  const w = Math.min(layout.sceneW - 16, maxW)
  const h = Math.min(layout.sceneH - 16, wantH)
  const x = layout.sceneX + (layout.sceneW - w) / 2
  const y = layout.sceneY + Math.max(8, (layout.sceneH - h) / 2)
  return { x, y, w, h }
}

export function drawPause(ctx: CanvasRenderingContext2D, hits: Hit[], layout: ViewLayout, state: ScreenState): void {
  dim(ctx, layout)
  const short = layout.sceneH < 500
  const cols = short ? 2 : 1
  const btnH = TAP_PT
  const gap = 10
  const inner = 16
  const titleH = HEAD_PT + 8
  const rows = short ? 2 : 4
  const wantH = titleH + inner * 2 + rows * btnH + (rows - 1) * gap
  const box = panelBox(layout, short ? 560 : 420, wantH)
  fillRound(ctx, box.x, box.y, box.w, box.h, 22, CREAM, LINE, 3)
  drawText(ctx, state.copy.pause, box.x + box.w / 2, box.y + inner + HEAD_PT / 2, HEAD_PT, 'center', INK, 800)
  const items = [
    { id: 'resume', title: state.copy.resume },
    { id: 'to-menu', title: state.copy.switchLevel },
    { id: 'pause-sound', title: state.muted ? state.copy.soundOn : state.copy.soundOff },
    { id: 'open-settings', title: state.copy.settings },
  ]
  items.forEach((item, i) => {
    const col = cols === 2 ? i % 2 : 0
    const row = cols === 2 ? Math.floor(i / 2) : i
    const bw = cols === 2 ? (box.w - inner * 2 - gap) / 2 : box.w - inner * 2
    const bx = box.x + inner + col * (bw + gap)
    const by = box.y + inner + titleH + row * (btnH + gap)
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
  const short = layout.sceneH < 500
  const inner = 14
  const btnH = TAP_PT
  const box = panelBox(layout, short ? 600 : 440, short ? layout.sceneH - 16 : 520)
  fillRound(ctx, box.x, box.y, box.w, box.h, 22, CREAM, LINE, 3)
  let cy = box.y + inner + HEAD_PT / 2
  drawText(ctx, state.copy.settings, box.x + box.w / 2, cy, HEAD_PT, 'center', INK, 800)
  cy += HEAD_PT / 2 + 8
  drawText(ctx, state.copy.language, box.x + box.w / 2, cy + 8, TEXT_PT, 'center', MUTED, 600)
  cy += 18
  cy += drawFlags(ctx, hits, box.x + inner, cy, box.w - inner * 2, state.locale, state.pressed) + 10
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
    const bw = cols === 2 ? (box.w - inner * 2 - 10) / 2 : box.w - inner * 2
    const bx = box.x + inner + col * (bw + 10)
    const by = cy + row * (btnH + 8)
    if (by + btnH > box.y + box.h - 8) return
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
  const box = panelBox(layout, 440, 240)
  fillRound(ctx, box.x, box.y, box.w, box.h, 22, CREAM, LINE, 3)
  drawText(ctx, state.copy.controller, box.x + box.w / 2, box.y + 36, HEAD_PT, 'center', INK, 800)
  drawWrapped(ctx, state.padStatus || state.copy.padLogo, box.x + box.w / 2, box.y + 70, box.w - 32, TEXT_PT, 'center', MUTED)
  drawButton(
    ctx,
    hits,
    'pad-cancel',
    box.x + 16,
    box.y + box.h - TAP_PT - 16,
    box.w - 32,
    TAP_PT,
    state.copy.cancel,
    undefined,
    state.pressed === 'pad-cancel',
  )
}

export function drawRotate(ctx: CanvasRenderingContext2D, layout: ViewLayout, copy: Copy): void {
  const w = Math.min(layout.sceneW - 24, 420)
  const x = layout.sceneX + (layout.sceneW - w) / 2
  const y = layout.sceneY + 10
  fillRound(ctx, x, y, w, 88, 18, 'rgba(246, 226, 196, 0.96)', LINE, 3)
  drawText(ctx, copy.turnPhone, x + w / 2, y + 32, HEAD_PT, 'center', INK, 800)
  drawText(ctx, copy.turnPhoneHint, x + w / 2, y + 62, TEXT_PT, 'center', MUTED, 600)
}

export function drawLetterbox(ctx: CanvasRenderingContext2D, layout: ViewLayout): void {
  if (layout.fillView) {
    ctx.fillStyle = PEACH
    ctx.fillRect(0, 0, layout.viewW, layout.viewH)
    return
  }
  ctx.fillStyle = SAND
  ctx.fillRect(0, 0, layout.viewW, layout.viewH)
  ctx.fillStyle = PEACH
  ctx.fillRect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
}

function dim(ctx: CanvasRenderingContext2D, layout: ViewLayout): void {
  ctx.fillStyle = 'rgba(92, 59, 50, 0.28)'
  ctx.fillRect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
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
