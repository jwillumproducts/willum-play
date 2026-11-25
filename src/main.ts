import './style.css'
import { Sound } from './audio'
import { BRAND, COPY, fill, isLocale, type Copy, type Locale } from './copy'
import { Game } from './game'
import { gameById } from './games'
import { drawPad, layoutPad, padAt, type PadButton } from './gamepad'
import { detectLocale, localeFromPath, localePath, publicUrl, rememberLocale } from './locale'
import { samplePads, type PadSnapshot } from './pads'
import {
  drawDevice,
  drawIntro,
  drawLetterbox,
  drawPadWait,
  drawPause,
  drawPicker,
  drawRotate,
  drawSettings,
} from './screens'
import { loadSave, writeSave, type SaveData } from './storage'
import type { Action, GameId, LevelId } from './types'
import { fontMarks, hitAt, resetFontMarks, type Hit } from './ui'
import { computeLayout, watchView, type ViewLayout } from './viewport'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('Mangler #app')

const canvas = document.createElement('canvas')
canvas.id = 'stage'
canvas.setAttribute('aria-hidden', 'true')
const sr = document.createElement('div')
sr.className = 'sr-only'
sr.id = 'sr'
root.innerHTML = ''
root.append(canvas, sr)

const rawCtx = canvas.getContext('2d')
if (!rawCtx) throw new Error('Canvas er ikke tilgængelig')
const ctx: CanvasRenderingContext2D = rawCtx

const sound = new Sound()
let save = loadSave()
sound.setMuted(save.muted)

type Route = 'intro' | 'device' | 'menu' | 'play'
type Overlay = 'pause' | 'settings' | 'pad' | null
let route: Route = 'intro'
let overlay: Overlay = null
let locale: Locale = 'da'
let game: Game | null = null
let layout: ViewLayout = computeLayout()
let hits: Hit[] = []
let padButtons: PadButton[] = []
let pressed: string | null = null
let scroll = 0
let maxScroll = 0
let padSnap: PadSnapshot = samplePads()
let lastInput = performance.now()
let dragging = false
let dragY = 0
let dragScroll = 0
const pointers = new Map<number, Action | 'pause'>()
let heldCaps: string[] = []

function copy(): Copy {
  return COPY[locale]
}

function persist(partial: Partial<SaveData>): void {
  save = { ...save, ...partial }
  writeSave(save)
}

function usingTouch(): boolean {
  return save.device === 'tablet'
}

function usingPad(): boolean {
  return save.device === 'controller'
}

function applyDocument(): void {
  const c = copy()
  document.documentElement.lang = c.htmlLang
  document.title = c.seoTitle
  document.querySelector('meta[name="description"]')?.setAttribute('content', c.seoDescription)
  sr.innerHTML = `<h1>${BRAND}</h1><p>${c.intro.join(' ')}</p><p>${c.chooseDevice}. ${c.chooseLevel}.</p><p>${c.credit}</p>`
}

function stopGame(): void {
  game?.stop()
  game = null
}

function startPlay(): void {
  stopGame()
  const mini = gameById(save.game)
  const level = mini.levels.find((item) => item.id === save.level) ?? mini.levels[0]
  sound.use({ peck: publicUrl(mini.sounds.peck), peep: mini.sounds.peep ? publicUrl(mini.sounds.peep) : undefined })
  game = new Game(level, mini.id, sound, (caps) => {
    heldCaps = caps
  }, usingPad(), () => togglePause())
  game.start()
  if (layout.mode === 'overlay' && usingTouch()) game.ensureX(220 / Math.max(0.2, layout.scale))
  if (layout.phone) void lockLandscape()
}

async function lockLandscape(): Promise<void> {
  const ori = window.screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> }
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    /* iOS */
  }
  if (ori && typeof ori.lock === 'function') {
    void ori.lock('landscape').catch(() => undefined)
  }
}

function togglePause(): void {
  if (route !== 'play' || !game) return
  if (overlay === 'pause') {
    overlay = null
    game.setPaused(needsRotate())
  } else if (!overlay) {
    overlay = 'pause'
    game.setPaused(true)
  }
}

function needsRotate(): boolean {
  return route === 'play' && usingTouch() && layout.phone && layout.portrait
}

function state() {
  return {
    copy: copy(),
    locale,
    device: save.device,
    muted: sound.muted,
    lastGame: save.game,
    lastLevel: save.level,
    pressed,
    scroll,
    padStatus: padMessage(),
  }
}

function padMessage(): string {
  const c = copy()
  if (padSnap.kind === 'ready') return fill(c.connected, padSnap.model || c.controller)
  if (padSnap.kind === 'unread') return c.padUnread
  if (padSnap.kind === 'wait') return c.padWait
  return c.padLogo
}

function sizeCanvas(): void {
  layout = computeLayout(route !== 'play')
  const { viewW, viewH, dpr, left, top } = layout
  canvas.style.left = `${left}px`
  canvas.style.top = `${top}px`
  canvas.style.width = `${viewW}px`
  canvas.style.height = `${viewH}px`
  const pw = Math.max(1, Math.round(viewW * dpr))
  const ph = Math.max(1, Math.round(viewH * dpr))
  if (canvas.width !== pw) canvas.width = pw
  if (canvas.height !== ph) canvas.height = ph
}

function paint(now: number): void {
  sizeCanvas()
  ctx.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0)
  ctx.clearRect(0, 0, layout.viewW, layout.viewH)
  drawLetterbox(ctx, layout)
  hits = []
  resetFontMarks()

  ctx.save()
  ctx.beginPath()
  ctx.rect(layout.sceneX, layout.sceneY, layout.sceneW, layout.sceneH)
  ctx.clip()
  ctx.translate(layout.sceneX, layout.sceneY)
  ctx.scale(layout.scale, layout.scale)
  if (route === 'play' && game) {
    game.step(now)
    if (overlay) game.setPaused(true)
    else game.setPaused(needsRotate())
    if (layout.mode === 'overlay' && usingTouch() && !needsRotate()) {
      game.keepClear(200, 200, 200, layout.scale)
    } else {
      game.camX = 0
      game.camY = 0
    }
    game.draw(ctx)
  }
  ctx.restore()

  const st = state()
  if (route === 'intro') drawIntro(ctx, hits, layout, st)
  else if (route === 'device') drawDevice(ctx, hits, layout, st)
  else if (route === 'menu') maxScroll = drawPicker(ctx, hits, layout, st)
  else if (route === 'play') {
    if (usingTouch() && game) {
      const level = gameById(save.game).levels.find((item) => item.id === save.level)
      const actions = new Set(level?.actions ?? [])
      padButtons = layoutPad(layout, actions.has('jump'), actions.has('brake'), actions.has('interact'))
      const idle = now - lastInput > 2500
      const held = new Set<string>([...heldCaps.map(capToAction), ...pointers.values()].filter(Boolean) as string[])
      drawPad(ctx, hits, padButtons, held, idle, now)
    }
    if (needsRotate()) drawRotate(ctx, layout, copy())
    if (overlay === 'pause') drawPause(ctx, hits, layout, st)
  }
  if (overlay === 'settings') drawSettings(ctx, hits, layout, st)
  if (overlay === 'pad') {
    padSnap = samplePads()
    if (padSnap.kind === 'ready') {
      persist({ device: 'controller', pad: padSnap.brand ?? save.pad ?? 'xbox' })
      overlay = null
      route = 'menu'
    }
    drawPadWait(ctx, hits, layout, state())
  }

  exposeDebug()
  requestAnimationFrame(paint)
}

function capToAction(cap: string): Action | '' {
  if (cap === 'left') return 'moveLeft'
  if (cap === 'right') return 'moveRight'
  if (cap === 'up') return 'moveUp'
  if (cap === 'down') return 'moveDown'
  if (cap === 'space') return save.game === 'car' ? 'brake' : 'jump'
  if (cap === 'enter') return 'interact'
  return ''
}

function cssPoint(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onDown(event: PointerEvent): void {
  event.preventDefault()
  sound.unlock()
  lastInput = performance.now()
  const p = cssPoint(event)
  if (route === 'menu' && overlay === null) {
    dragging = true
    dragY = p.y
    dragScroll = scroll
  }
  if (route === 'play' && overlay === null && usingTouch()) {
    const btn = padAt(padButtons, p.x, p.y)
    if (btn) {
      pointers.set(event.pointerId, btn.action)
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        /* */
      }
      if (btn.action === 'pause') togglePause()
      else {
        game?.holdPointer(event.pointerId, btn.action)
        sound.tap()
      }
      return
    }
  }
  const hit = hitAt(hits, p.x, p.y)
  if (hit) {
    pressed = hit.id
    activate(hit.id, true)
  }
}

function onMove(event: PointerEvent): void {
  if (!dragging) return
  const p = cssPoint(event)
  scroll = Math.min(maxScroll, Math.max(0, dragScroll + (dragY - p.y)))
}

function onUp(event: PointerEvent): void {
  dragging = false
  const action = pointers.get(event.pointerId)
  if (action && action !== 'pause') game?.releasePointer(event.pointerId)
  pointers.delete(event.pointerId)
  const p = cssPoint(event)
  const hit = hitAt(hits, p.x, p.y)
  if (pressed && hit && hit.id === pressed) activate(hit.id, false)
  pressed = null
}

function activate(id: string, down: boolean): void {
  if (down) return
  lastInput = performance.now()
  if (id.startsWith('lang-')) {
    const next = id.slice(5)
    if (isLocale(next) && next !== locale) {
      locale = next
      rememberLocale(next)
      history.pushState({ route, overlay }, '', localePath(next))
      applyDocument()
    }
    overlay = overlay === 'settings' ? null : overlay
    return
  }
  if (id === 'cta-device') {
    route = 'device'
    return
  }
  if (id === 'dev-computer') {
    persist({ device: 'computer' })
    route = 'menu'
    scroll = 0
    return
  }
  if (id === 'dev-tablet') {
    persist({ device: 'tablet' })
    route = 'menu'
    scroll = 0
    return
  }
  if (id === 'dev-controller') {
    padSnap = samplePads()
    if (padSnap.kind === 'ready') {
      persist({ device: 'controller', pad: padSnap.brand ?? 'xbox' })
      route = 'menu'
      scroll = 0
    } else overlay = 'pad'
    return
  }
  if (id === 'pad-cancel') {
    overlay = null
    return
  }
  if (id.startsWith('level-')) {
    const parts = id.split('-')
    const gameId = parts[1] as GameId
    const level = Number(parts[2]) as LevelId
    persist({ game: gameId, level })
    route = 'play'
    overlay = null
    startPlay()
    return
  }
  if (id === 'back-device') {
    route = 'device'
    return
  }
  if (id === 'open-settings') {
    overlay = 'settings'
    return
  }
  if (id === 'set-close') {
    overlay = route === 'play' ? 'pause' : null
    return
  }
  if (id === 'set-device') {
    overlay = null
    stopGame()
    route = 'device'
    return
  }
  if (id === 'set-about') {
    overlay = null
    stopGame()
    route = 'intro'
    return
  }
  if (id === 'set-sound' || id === 'pause-sound') {
    sound.setMuted(!sound.muted)
    persist({ muted: sound.muted })
    return
  }
  if (id === 'resume') {
    overlay = null
    game?.setPaused(needsRotate())
    return
  }
  if (id === 'to-menu') {
    overlay = null
    stopGame()
    route = 'menu'
    scroll = 0
  }
}

function exposeDebug(): void {
  const padHits = hits.filter((h) => h.id.startsWith('pad-'))
  const menuHits = hits.filter((h) => !h.id.startsWith('pad-'))
  const heads = fontMarks.filter((m) => m.role === 'head')
  const bodies = fontMarks.filter((m) => m.role === 'body')
  ;(window as unknown as { __willum: unknown }).__willum = {
    screen: route,
    overlay,
    layout,
    hits,
    scale: layout.scale,
    fonts: fontMarks.map((m) => ({ text: m.text, pt: m.pt, role: m.role })),
    taps: menuHits.map((h) => ({ id: h.id, w: h.w, h: h.h, fontPt: h.fontPt })),
    pads: padHits.map((h) => ({ id: h.id, w: h.w, h: h.h })),
    minFont: fontMarks.reduce((m, h) => Math.min(m, h.pt), 99),
    minHead: heads.reduce((m, h) => Math.min(m, h.pt), 99),
    minBody: bodies.reduce((m, h) => Math.min(m, h.pt), 99),
    minTap: menuHits.reduce((m, h) => Math.min(m, h.h, h.w), 999),
    minPad: padHits.reduce((m, h) => Math.min(m, h.h, h.w), 999),
    scene: {
      x: layout.sceneX,
      y: layout.sceneY,
      w: layout.sceneW,
      h: layout.sceneH,
      viewW: layout.viewW,
      viewH: layout.viewH,
      mode: layout.mode,
      fillView: layout.fillView,
    },
  }
}

function onWheel(event: WheelEvent): void {
  if (route !== 'menu') return
  event.preventDefault()
  scroll = Math.min(maxScroll, Math.max(0, scroll + event.deltaY))
}

function onKey(event: KeyboardEvent): void {
  if (event.code !== 'Escape') return
  event.preventDefault()
  if (overlay === 'settings') overlay = route === 'play' ? 'pause' : null
  else if (overlay === 'pause') togglePause()
  else if (route === 'play') togglePause()
}

canvas.addEventListener('pointerdown', onDown)
canvas.addEventListener('pointermove', onMove)
canvas.addEventListener('pointerup', onUp)
canvas.addEventListener('pointercancel', onUp)
canvas.addEventListener('wheel', onWheel, { passive: false })
canvas.addEventListener('contextmenu', (event) => event.preventDefault())
window.addEventListener('keydown', onKey)
document.addEventListener('gesturestart', (event: Event) => {
  event.preventDefault()
})
document.addEventListener(
  'touchmove',
  (event) => {
    event.preventDefault()
  },
  { passive: false },
)

const found = localeFromPath()
if (!found) {
  location.replace(localePath(detectLocale()))
} else {
  locale = found
  applyDocument()
  watchView(() => {
    window.scrollTo(0, 0)
  })
  requestAnimationFrame(paint)
}
