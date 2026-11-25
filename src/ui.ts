import type { Locale } from './copy'
import { LOCALES, NATIVE_NAME } from './copy'
import type { ViewLayout } from './viewport'

export const FONT = '"Segoe UI", "Trebuchet MS", "Arial Rounded MT Bold", sans-serif'
export const INK = '#5c3b32'
export const MUTED = '#8a6558'
export const CREAM = '#fffaf3'
export const PEACH = '#f6e2c4'
export const SAND = '#f3c9a4'
export const LINE = '#e7b089'
export const ACCENT = '#e07a5f'
export const TEXT_PT = 16
export const HEAD_PT = 22
export const TAP_PT = 64
export const FLAG_HIT = 44

export interface FontMark {
  text: string
  pt: number
  role: 'head' | 'body'
}

export const fontMarks: FontMark[] = []

export function resetFontMarks(): void {
  fontMarks.length = 0
}

export interface Hit {
  id: string
  x: number
  y: number
  w: number
  h: number
  fontPt?: number
}

export function font(pt: number, weight = 650): string {
  return `${weight} ${Math.max(TEXT_PT, pt)}px ${FONT}`
}

function markFont(text: string, pt: number, role: 'head' | 'body'): number {
  const size = Math.max(role === 'head' ? HEAD_PT : TEXT_PT, pt)
  fontMarks.push({ text: text.slice(0, 48), pt: size, role })
  return size
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

export function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  width = 3,
): void {
  roundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = width
    ctx.stroke()
  }
}

export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  pt: number,
): string[] {
  ctx.font = font(pt, 600)
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxW || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  pt: number,
  align: CanvasTextAlign = 'left',
  color = INK,
  weight = 650,
): void {
  const size = markFont(text, pt, pt >= HEAD_PT ? 'head' : 'body')
  ctx.font = font(size, weight)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

export function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  pt: number,
  align: CanvasTextAlign = 'center',
  color = INK,
): number {
  const lines = wrapLines(ctx, text, maxW, pt)
  const lh = pt * 1.35
  lines.forEach((line, i) => {
    drawText(ctx, line, x, y + i * lh, pt, align, color, 600)
  })
  return lines.length * lh
}

export function hitAt(hits: Hit[], x: number, y: number): Hit | null {
  for (let i = hits.length - 1; i >= 0; i -= 1) {
    const h = hits[i]
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h
  }
  return null
}

export function addHit(hits: Hit[], hit: Hit): void {
  hits.push(hit)
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  hits: Hit[],
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  note: string | undefined,
  pressed: boolean,
  current = false,
): void {
  const height = Math.max(TAP_PT, h)
  const width = Math.max(TAP_PT, w)
  fillRound(
    ctx,
    x,
    y,
    width,
    height,
    18,
    pressed ? '#ffe8a3' : CREAM,
    current ? ACCENT : LINE,
    current ? 4 : 3,
  )
  const titlePt = markFont(title, 18, 'body')
  ctx.font = font(titlePt, 750)
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const pad = 16
  if (note) {
    ctx.fillText(title, x + pad, y + height * 0.38)
    const notePt = markFont(note, TEXT_PT, 'body')
    ctx.font = font(notePt, 600)
    ctx.fillStyle = MUTED
    ctx.fillText(note, x + pad, y + height * 0.68)
  } else {
    ctx.textAlign = 'center'
    ctx.fillText(title, x + width / 2, y + height / 2)
  }
  addHit(hits, { id, x, y, w: width, h: height, fontPt: titlePt })
}

export function drawFlag(ctx: CanvasRenderingContext2D, locale: Locale, x: number, y: number, w: number, h: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(w / 60, h / 40)
  if (locale === 'da') {
    ctx.fillStyle = '#c60c30'
    ctx.fillRect(0, 0, 60, 40)
    ctx.fillStyle = '#fff'
    ctx.fillRect(18, 0, 8, 40)
    ctx.fillRect(0, 16, 60, 8)
  } else if (locale === 'en') {
    ctx.fillStyle = '#012169'
    ctx.fillRect(0, 0, 60, 40)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(60, 40)
    ctx.moveTo(60, 0)
    ctx.lineTo(0, 40)
    ctx.stroke()
    ctx.strokeStyle = '#c8102e'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.moveTo(30, 0)
    ctx.lineTo(30, 40)
    ctx.moveTo(0, 20)
    ctx.lineTo(60, 20)
    ctx.stroke()
    ctx.strokeStyle = '#c8102e'
    ctx.lineWidth = 8
    ctx.stroke()
  } else if (locale === 'es') {
    ctx.fillStyle = '#c60b1e'
    ctx.fillRect(0, 0, 60, 40)
    ctx.fillStyle = '#ffc400'
    ctx.fillRect(0, 10, 60, 20)
  } else if (locale === 'de') {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 60, 13.4)
    ctx.fillStyle = '#dd0000'
    ctx.fillRect(0, 13.3, 60, 13.4)
    ctx.fillStyle = '#ffce00'
    ctx.fillRect(0, 26.6, 60, 13.4)
  } else if (locale === 'zh') {
    ctx.fillStyle = '#de2910'
    ctx.fillRect(0, 0, 60, 40)
    ctx.fillStyle = '#ffde00'
    star(ctx, 12, 12, 5, 6, 2.5)
  } else if (locale === 'hi') {
    ctx.fillStyle = '#ff9933'
    ctx.fillRect(0, 0, 60, 13.4)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 13.3, 60, 13.4)
    ctx.fillStyle = '#138808'
    ctx.fillRect(0, 26.6, 60, 13.4)
    ctx.strokeStyle = '#000080'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(30, 20, 4.5, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.fillStyle = '#0055a4'
    ctx.fillRect(0, 0, 20, 40)
    ctx.fillStyle = '#fff'
    ctx.fillRect(20, 0, 20, 40)
    ctx.fillStyle = '#ef4135'
    ctx.fillRect(40, 0, 20, 40)
  }
  ctx.restore()
}

function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spikes: number,
  outer: number,
  inner: number,
): void {
  ctx.beginPath()
  let rot = Math.PI / 2
  const step = Math.PI / spikes
  ctx.moveTo(x, y - outer)
  for (let i = 0; i < spikes; i += 1) {
    ctx.lineTo(x + Math.cos(rot) * outer, y - Math.sin(rot) * outer)
    rot += step
    ctx.lineTo(x + Math.cos(rot) * inner, y - Math.sin(rot) * inner)
    rot += step
  }
  ctx.closePath()
  ctx.fill()
}

export function drawFlags(
  ctx: CanvasRenderingContext2D,
  hits: Hit[],
  x: number,
  y: number,
  maxW: number,
  current: Locale,
  pressedId: string | null,
): number {
  const gap = 8
  const visualW = 52
  const visualH = 36
  const hit = TAP_PT
  const count = LOCALES.length
  const perRow = Math.max(1, Math.min(count, Math.floor((maxW + gap) / (hit + gap))))
  const rows = Math.ceil(count / perRow)
  for (let row = 0; row < rows; row += 1) {
    const slice = LOCALES.slice(row * perRow, row * perRow + perRow)
    const rowW = slice.length * hit + (slice.length - 1) * gap
    const startX = x + Math.max(0, (maxW - rowW) / 2)
    slice.forEach((locale, i) => {
      const bx = startX + i * (hit + gap)
      const by = y + row * (hit + gap)
      const hx = bx + (hit - visualW) / 2
      const hy = by + (hit - visualH) / 2
      if (locale === current) {
        fillRound(ctx, hx - 4, hy - 4, visualW + 8, visualH + 8, 8, CREAM, INK, 3)
      }
      if (pressedId === `lang-${locale}`) ctx.globalAlpha = 0.85
      drawFlag(ctx, locale, hx, hy, visualW, visualH)
      ctx.globalAlpha = 1
      addHit(hits, { id: `lang-${locale}`, x: bx, y: by, w: hit, h: hit, fontPt: TEXT_PT })
    })
  }
  return rows * hit + (rows - 1) * gap
}

export function cornerFlagRect(layout: ViewLayout): { x: number; y: number; w: number; h: number } {
  const insetR = 8 + layout.safe.r
  const insetT = 8 + layout.safe.t
  const x = Math.max(layout.sceneX, layout.viewW - insetR - FLAG_HIT)
  const y = Math.max(0, insetT)
  return { x, y, w: FLAG_HIT, h: FLAG_HIT }
}

export function drawCornerFlag(
  ctx: CanvasRenderingContext2D,
  hits: Hit[],
  layout: ViewLayout,
  current: Locale,
  pressedId: string | null,
): void {
  const box = cornerFlagRect(layout)
  const visW = 28
  const visH = 19
  const hx = box.x + (box.w - visW) / 2
  const hy = box.y + (box.h - visH) / 2
  fillRound(ctx, hx - 3, hy - 3, visW + 6, visH + 6, 6, CREAM, INK, 2)
  if (pressedId === 'lang-open') ctx.globalAlpha = 0.85
  drawFlag(ctx, current, hx, hy, visW, visH)
  ctx.globalAlpha = 1
  addHit(hits, { id: 'lang-open', x: box.x, y: box.y, w: box.w, h: box.h, fontPt: TEXT_PT })
}

export function drawLangPopup(
  ctx: CanvasRenderingContext2D,
  hits: Hit[],
  layout: ViewLayout,
  current: Locale,
  pressedId: string | null,
  title: string,
): void {
  ctx.fillStyle = 'rgba(92, 59, 50, 0.28)'
  ctx.fillRect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
  addHit(hits, {
    id: 'lang-dismiss',
    x: layout.sceneX,
    y: layout.sceneY,
    w: layout.sceneW,
    h: layout.sceneH,
    fontPt: TEXT_PT,
  })

  const gap = 6
  const cell = FLAG_HIT
  const inner = 10
  const titleH = TEXT_PT + 10
  const maxW = layout.sceneW - 16
  const cols = Math.max(1, Math.min(LOCALES.length, Math.floor((maxW - inner * 2 + gap) / (cell + gap))))
  const rows = Math.ceil(LOCALES.length / cols)
  const gridW = cols * cell + (cols - 1) * gap
  const gridH = rows * cell + (rows - 1) * gap
  const w = Math.min(maxW, gridW + inner * 2)
  const h = titleH + inner * 2 + gridH
  const x = layout.sceneX + layout.sceneW - 8 - w
  const y = layout.sceneY + 8
  const boxX = Math.max(layout.sceneX + 8, x)
  const boxY = Math.min(layout.sceneY + layout.sceneH - h - 8, Math.max(layout.sceneY + 8, y))

  fillRound(ctx, boxX, boxY, w, h, 16, CREAM, LINE, 3)
  drawText(ctx, title, boxX + w / 2, boxY + inner + TEXT_PT / 2, TEXT_PT, 'center', MUTED, 700)

  LOCALES.forEach((locale, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const bx = boxX + inner + col * (cell + gap)
    const by = boxY + inner + titleH + row * (cell + gap)
    const visW = 32
    const visH = 22
    const hx = bx + (cell - visW) / 2
    const hy = by + (cell - visH) / 2
    if (locale === current) fillRound(ctx, hx - 3, hy - 3, visW + 6, visH + 6, 6, CREAM, INK, 2)
    if (pressedId === `lang-${locale}`) ctx.globalAlpha = 0.85
    drawFlag(ctx, locale, hx, hy, visW, visH)
    ctx.globalAlpha = 1
    addHit(hits, { id: `lang-${locale}`, x: bx, y: by, w: cell, h: cell, fontPt: TEXT_PT })
  })
}

export { LOCALES, NATIVE_NAME }
