import './style.css'
import { Sound } from './audio'
import { BRAND, COPY, fill, isLocale, LOCALES, NATIVE_NAME, type Copy, type Locale } from './copy'
import { drawCarMark, drawHenMark } from './draw'
import { flagSvg } from './flags'
import { Game } from './game'
import { GAMES, gameById, type MiniGame } from './games'
import { KEY_ICON, PAD_ICON } from './icons'
import { detectLocale, localeFromPath, localePath, publicUrl, rememberLocale } from './locale'
import { padDown, samplePads, watchPads, type PadSnapshot } from './pads'
import { loadSave, writeSave, type SaveData } from './storage'
import {
  bindTouchBar,
  needsLandscapePrompt,
  pinPlaySurface,
  touchBarMarkup,
  tryLandscapeLock,
  turnOverlayMarkup,
  watchVisualViewport,
} from './touch'
import type { Action, GameId, KeyCap, LevelConfig, LevelId, PadBrand } from './types'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('Mangler #app')
const app: HTMLElement = root

const sound = new Sound()
let save = loadSave()
sound.setMuted(save.muted)
sound.use(clipsFor(gameById(save.game)))

type Screen = 'intro' | 'device' | 'menu' | 'play'
let screen: Screen = 'device'
let locale: Locale = 'da'
let game: Game | null = null
let pauseOpen = false
let settingsOpen = false
let unwatch: (() => void) | null = null
let unorient: (() => void) | null = null
let padSnap: PadSnapshot = samplePads()
let padDialog = false
let turnBlocked = false

function clipsFor(mini: MiniGame) {
  return {
    peck: publicUrl(mini.sounds.peck),
    peep: mini.sounds.peep ? publicUrl(mini.sounds.peep) : undefined,
  }
}

function ui(): Copy {
  return COPY[locale]
}

const KEY_ORDER: KeyCap[] = ['left', 'right', 'up', 'down', 'space', 'enter']
const ACTION_CAP: Record<Action, KeyCap> = {
  moveLeft: 'left',
  moveRight: 'right',
  moveUp: 'up',
  moveDown: 'down',
  jump: 'space',
  brake: 'space',
  interact: 'enter',
}
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Escape') return
  if (settingsOpen) {
    event.preventDefault()
    closeSettings()
    return
  }
  if (padDialog) {
    event.preventDefault()
    closePadDialog()
    return
  }
  if (screen !== 'play') return
  event.preventDefault()
  if (pauseOpen) closePause()
  else openPause()
})

function persist(partial: Partial<SaveData>): void {
  save = { ...save, ...partial }
  writeSave(save)
}

function mount(): void {
  unwatch?.()
  unwatch = null
  unorient?.()
  unorient = null
  turnBlocked = false
  padDialog = false
  settingsOpen = false
  game?.stop()
  game = null
  pauseOpen = false
  document.documentElement.classList.remove('is-touch-play', 'is-phone-portrait', 'is-picker')
  document.documentElement.classList.toggle('is-picker', screen !== 'play')
  if (screen === 'intro') mountIntro()
  else if (screen === 'device') mountDevice()
  else if (screen === 'menu') mountMenu()
  else mountPlay()
}

function mountIntro(): void {
  const copy = ui()
  app.innerHTML = `
    <main class="screen is-front">
      <div class="front">
        <h1>${BRAND}</h1>
        ${flagsMarkup()}
        <p class="front-tag">${copy.intro[0]}</p>
        <div class="front-art is-hero">
          <figure>
            <canvas data-preview="hen" width="220" height="160" aria-hidden="true"></canvas>
            <figcaption>${copy.hen}</figcaption>
          </figure>
          <figure>
            <canvas data-preview="car" width="220" height="160" aria-hidden="true"></canvas>
            <figcaption>${copy.car}</figcaption>
          </figure>
        </div>
        <div class="intro">
          ${copy.intro.slice(1).map((paragraph) => `<p>${paragraph}</p>`).join('')}
        </div>
        <button class="choice" type="button" data-action="device">
          <span class="choice-title">${copy.chooseDevice}</span>
          <span class="choice-note">${copy.chooseDeviceNote}</span>
        </button>
        <p class="credit">${copy.credit}</p>
      </div>
    </main>
  `
  app.querySelectorAll<HTMLCanvasElement>('[data-preview]').forEach((canvas) => paintPreview(canvas))
  bindFlags()
  app.querySelector<HTMLButtonElement>('[data-action="device"]')?.addEventListener('click', goDevice)
}

function goDevice(): void {
  screen = 'device'
  history.pushState({ screen: 'device' }, '', localePath(locale))
  applyDocument()
  mount()
}

function goIntro(): void {
  screen = 'intro'
  history.pushState({ screen: 'intro' }, '', localePath(locale))
  applyDocument()
  mount()
}

function applyDocument(): void {
  const copy = ui()
  document.documentElement.lang = copy.htmlLang
  document.title = copy.seoTitle
  document.querySelector('meta[name="description"]')?.setAttribute('content', copy.seoDescription)
}

function chooseLocale(next: Locale): void {
  if (next === locale) {
    closeSettings()
    return
  }
  locale = next
  rememberLocale(next)
  history.pushState({ screen }, '', localePath(next))
  applyDocument()
  mount()
}

function soundIcon(muted: boolean): string {
  const speaker = '<path fill="currentColor" d="M4 9.5h3.4L12 5.4v13.2l-4.6-4.1H4z"/>'
  const waves = '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.2 9a4.2 4.2 0 0 1 0 6M17.6 6.6a7.4 7.4 0 0 1 0 10.8"/>'
  const slash = '<path fill="none" stroke="#fffaf3" stroke-width="4.5" stroke-linecap="round" d="M2.5 5.5 14.5 19"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M2.5 5.5 14.5 19"/>'
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${speaker}${muted ? slash : waves}</svg>`
}

function paintSoundButtons(): void {
  const label = sound.muted ? ui().soundOn : ui().soundOff
  app.querySelectorAll<HTMLButtonElement>('[data-sound]').forEach((button) => {
    button.innerHTML = soundIcon(sound.muted)
    button.setAttribute('aria-label', label)
  })
}

function toggleSound(): void {
  sound.unlock()
  sound.setMuted(!sound.muted)
  persist({ muted: sound.muted })
  paintSoundButtons()
}

function usingPad(): boolean {
  return save.device === 'controller' && save.pad !== null
}

function usingTouch(): boolean {
  return save.device === 'tablet'
}

function onActivate(el: HTMLElement, fn: () => void): void {
  let last = 0
  let startY = 0
  const run = (event: Event): void => {
    const now = performance.now()
    if (now - last < 350) {
      event.preventDefault()
      return
    }
    last = now
    fn()
  }
  el.addEventListener('click', run)
  el.addEventListener(
    'touchstart',
    (event) => {
      startY = event.touches[0]?.clientY ?? 0
    },
    { passive: true },
  )
  el.addEventListener(
    'touchend',
    (event) => {
      const y = event.changedTouches[0]?.clientY ?? startY
      if (Math.abs(y - startY) > 14) return
      event.preventDefault()
      run(event)
    },
    { passive: false },
  )
}

function faceFor(cap: KeyCap): { label: string } {
  const copy = ui()
  if (usingPad() && save.pad === 'playstation') {
    if (cap === 'space') return { label: copy.cross }
    if (cap === 'enter') return { label: copy.circle }
  }
  if (usingPad() && save.pad === 'xbox') {
    if (cap === 'space') return { label: 'A' }
    if (cap === 'enter') return { label: 'B' }
  }
  const labels: Record<KeyCap, string> = {
    left: copy.left,
    right: copy.right,
    up: copy.up,
    down: copy.down,
    space: copy.space,
    enter: copy.enter,
  }
  return { label: labels[cap] }
}

function gameTitle(id: GameId): string {
  return id === 'car' ? ui().car : ui().hen
}

function levelTitle(id: GameId, level: LevelId): string {
  const names = id === 'car' ? ui().carLevels : ui().henLevels
  return names[level - 1]
}

function flagsMarkup(): string {
  const buttons = LOCALES.map((code) => {
    const on = code === locale
    return `<button class="flag${on ? ' is-current' : ''}" type="button" data-locale="${code}" aria-label="${NATIVE_NAME[code]}" aria-pressed="${on}">${flagSvg(code)}</button>`
  }).join('')
  return `<div class="flags" role="group" aria-label="${ui().language}">${buttons}</div>`
}

function bindFlags(): void {
  app.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.locale
      if (isLocale(next)) chooseLocale(next)
    })
  })
}

function settingsMarkup(): string {
  const copy = ui()
  return `
    <div class="overlay overlay-page" data-settings hidden>
      <div class="panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h2 id="settings-title">${copy.settings}</h2>
        <p class="pad-help">${copy.language}</p>
        ${flagsMarkup()}
        <button class="sound-btn" type="button" data-sound aria-label="${sound.muted ? copy.soundOn : copy.soundOff}">${soundIcon(sound.muted)}</button>
        <button class="choice" type="button" data-settings-action="device"><span class="choice-title">${copy.switchDevice}</span></button>
        <button class="choice" type="button" data-settings-action="intro"><span class="choice-title">${copy.about}</span></button>
        <button class="choice" type="button" data-settings-action="close"><span class="choice-title">${copy.cancel}</span></button>
        <p class="credit">${copy.credit}</p>
      </div>
    </div>
  `
}

function bindSettings(): void {
  app.querySelector<HTMLButtonElement>('[data-open-settings]')?.addEventListener('click', openSettings)
  app.querySelector<HTMLButtonElement>('[data-settings-action="close"]')?.addEventListener('click', closeSettings)
  app.querySelector<HTMLButtonElement>('[data-settings] [data-sound]')?.addEventListener('click', toggleSound)
  app.querySelector<HTMLButtonElement>('[data-settings-action="device"]')?.addEventListener('click', () => {
    closeSettings()
    if (screen === 'device') return
    goDevice()
  })
  app.querySelector<HTMLButtonElement>('[data-settings-action="intro"]')?.addEventListener('click', () => {
    closeSettings()
    if (screen === 'intro') return
    goIntro()
  })
  bindFlags()
}

function openSettings(): void {
  const dialog = app.querySelector<HTMLElement>('[data-settings]')
  if (!dialog) return
  settingsOpen = true
  dialog.hidden = false
  dialog.querySelector<HTMLButtonElement>('.flag')?.focus()
}

function closeSettings(): void {
  settingsOpen = false
  const dialog = app.querySelector<HTMLElement>('[data-settings]')
  if (!dialog) return
  dialog.hidden = true
  app.querySelector<HTMLButtonElement>('[data-open-settings]')?.focus()
}

function iconFor(cap: KeyCap): string {
  if (usingPad() && save.pad) return PAD_ICON[save.pad][cap]
  return KEY_ICON[cap]
}

function mountDevice(): void {
  const copy = ui()
  const computer = save.device === 'computer'
  const tablet = save.device === 'tablet'
  app.innerHTML = `
    <main class="screen">
      <h1>${BRAND}</h1>
      ${flagsMarkup()}
      <div class="front-art">
        <figure>
          <canvas data-preview="hen" width="180" height="130" aria-hidden="true"></canvas>
          <figcaption>${copy.hen}</figcaption>
        </figure>
        <figure>
          <canvas data-preview="car" width="180" height="130" aria-hidden="true"></canvas>
          <figcaption>${copy.car}</figcaption>
        </figure>
      </div>
      <p class="lead">${copy.deviceLead}</p>
      <div class="stack">
        <button class="choice${computer ? ' is-current' : ''}" type="button" data-device="computer">
          <span class="choice-title">${copy.computer}</span>
          <span class="choice-note">${computer ? copy.chosenKeyboard : copy.keyboard}</span>
        </button>
        <button class="choice${save.device === 'controller' ? ' is-current' : ''}" type="button" data-device="controller">
          <span class="choice-title">${copy.controller}</span>
          <span class="choice-note" data-pad-note>${save.device === 'controller' ? fill(copy.chosenNamed, copy.padOr) : copy.padOr}</span>
        </button>
        <button class="choice${tablet ? ' is-current' : ''}" type="button" data-device="tablet">
          <span class="choice-title">${copy.tablet}</span>
          <span class="choice-note">${tablet ? copy.chosenTouch : copy.touch}</span>
        </button>
      </div>
      <button class="link" type="button" data-open-settings>${copy.settings}</button>
      <button class="link" type="button" data-action="intro">${copy.about}</button>
      <p class="credit">${copy.credit}</p>
    </main>
    <div class="overlay overlay-page" data-pad-dialog hidden>
      <div class="panel" role="dialog" aria-modal="true" aria-labelledby="pad-title">
        <h2 id="pad-title">${copy.controller}</h2>
        <p class="pad-help">${copy.padHelp}</p>
        <p class="pad-status" data-pad-status>${copy.padLogo}</p>
        <button class="choice" type="button" data-action="pad-cancel"><span class="choice-title">${copy.cancel}</span></button>
      </div>
    </div>
    ${settingsMarkup()}
  `
  app.querySelectorAll<HTMLCanvasElement>('[data-preview]').forEach((canvas) => paintPreview(canvas))
  bindSettings()
  const computerBtn = app.querySelector<HTMLButtonElement>('[data-device="computer"]')
  if (computerBtn) {
    onActivate(computerBtn, () => {
      sound.unlock()
      persist({ device: 'computer' })
      screen = 'menu'
      mount()
    })
  }
  app.querySelector<HTMLButtonElement>('[data-device="controller"]')?.addEventListener('click', () => {
    if (padSnap.kind === 'ready') acceptPad(padSnap)
    else openPadDialog()
  })
  const tabletBtn = app.querySelector<HTMLButtonElement>('[data-device="tablet"]')
  if (tabletBtn) {
    onActivate(tabletBtn, () => {
      sound.unlock()
      persist({ device: 'tablet' })
      screen = 'menu'
      mount()
    })
  }
  app.querySelector<HTMLButtonElement>('[data-action="pad-cancel"]')?.addEventListener('click', closePadDialog)
  app.querySelector<HTMLButtonElement>('[data-action="intro"]')?.addEventListener('click', goIntro)
  unwatch = watchPads((snap) => {
    padSnap = snap
    if (padDialog && snap.logoEdge && snap.kind === 'ready') {
      acceptPad(snap)
      return
    }
    paintPad(snap)
  })
}

function acceptPad(snap: PadSnapshot): void {
  sound.unlock()
  persist({ device: 'controller', pad: snap.brand ?? save.pad ?? 'xbox' })
  screen = 'menu'
  mount()
}

function openPadDialog(): void {
  padDialog = true
  const dialog = app.querySelector<HTMLElement>('[data-pad-dialog]')
  if (!dialog) return
  dialog.hidden = false
  paintPad(padSnap)
  app.querySelector<HTMLButtonElement>('[data-action="pad-cancel"]')?.focus()
}

function closePadDialog(): void {
  padDialog = false
  const dialog = app.querySelector<HTMLElement>('[data-pad-dialog]')
  if (!dialog) return
  dialog.hidden = true
  app.querySelector<HTMLButtonElement>('[data-device="controller"]')?.focus()
}

function paintPad(snap: PadSnapshot): void {
  const note = app.querySelector<HTMLElement>('[data-pad-note]')
  const button = app.querySelector<HTMLButtonElement>('[data-device="controller"]')
  const chosen = save.device === 'controller'
  if (button) button.classList.toggle('is-current', chosen)
  if (note) {
    note.textContent = chosen && snap.kind === 'ready' ? fill(ui().chosenNamed, connectedName(snap)) : chosen ? fill(ui().chosenNamed, ui().padOr) : ui().padOr
  }
  const status = app.querySelector<HTMLElement>('[data-pad-status]')
  if (status && padDialog) status.textContent = padStatusText(snap)
}

function padStatusText(snap: PadSnapshot): string {
  const copy = ui()
  if (snap.kind === 'ready') return fill(copy.connected, connectedName(snap))
  if (snap.kind === 'unread') return copy.padUnread
  if (snap.kind === 'wait') return copy.padWait
  return copy.padLogo
}

function controllerTitle(brand: PadBrand | null, model: string): string {
  const name = brand === 'playstation' ? 'PlayStation' : brand === 'xbox' ? 'Xbox' : ''
  if (!name) return ui().controller
  const specific = model !== '' && model !== 'Controller' && model !== name
  if (!specific) return fill(ui().controllerOf, name)
  if (model.startsWith(name)) return model
  return `${name} ${model}`
}

function connectedName(snap: PadSnapshot): string {
  return controllerTitle(snap.brand ?? save.pad, snap.model)
}

function menuPadLabel(snap: PadSnapshot, seen: boolean): string {
  const copy = ui()
  if (snap.kind === 'ready') return fill(copy.connected, connectedName(snap))
  if (snap.kind === 'unread') return copy.padUnread
  if (snap.kind === 'wait') return connectedName(snap)
  if (seen) return copy.noPad
  return controllerTitle(save.pad, '')
}

function mountMenu(): void {
  const rows = GAMES.map((mini) => {
    const cards = mini.levels
      .map((level) => {
        const copy = ui()
        const last = save.game === mini.id && save.level === level.id
        const view = level.camera === 'side' ? copy.side : copy.top
        const caps = capsFor(level)
        const label = caps.map((cap) => faceFor(cap).label).join(', ')
        const title = levelTitle(mini.id, level.id)
        return `
      <button class="choice level-card${last ? ' is-last' : ''}" type="button" data-game="${mini.id}" data-level="${level.id}" aria-label="${gameTitle(mini.id)}, ${copy.levelWord} ${level.id}, ${title}, ${label}">
        <span class="choice-kicker">${copy.levelWord} ${level.id}<span class="last-mark${last ? '' : ' is-off'}"> · ${copy.lastPicked}</span></span>
        <span class="choice-title">${title}</span>
        <span class="hint" aria-hidden="true">${keysMarkup(level)}</span>
        <span class="choice-note">${view}</span>
      </button>
    `
      })
      .join('')
    return `
      <section class="game-row" aria-label="${gameTitle(mini.id)}">
        <div class="game-mark">
          <canvas data-preview="${mini.id}" width="112" height="80" aria-hidden="true"></canvas>
          <span class="game-name">${gameTitle(mini.id)}</span>
        </div>
        <div class="game-levels">${cards}</div>
      </section>
    `
  }).join('')

  const copy = ui()
  app.innerHTML = `
    <main class="screen is-picker">
      <h1>${copy.chooseLevel}</h1>
      <p class="lead">${usingPad() || usingTouch() ? copy.practicePad : copy.practiceKey}</p>
      ${usingPad() ? `<p class="pad-status" data-menu-pad>${menuPadLabel(samplePads(), false)}</p>` : ''}
      <div class="game-list">${rows}</div>
      <button class="link" type="button" data-action="device">${copy.switchDevice}</button>
      <button class="link" type="button" data-open-settings>${copy.settings}</button>
    </main>
    ${settingsMarkup()}
  `
  bindSettings()

  app.querySelectorAll<HTMLCanvasElement>('[data-preview]').forEach((canvas) => {
    paintPreview(canvas)
  })

  app.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
    onActivate(button, () => {
      const id = Number(button.dataset.level) as LevelId
      const picked = button.dataset.game
      const gameId = picked === 'hen' || picked === 'car' ? picked : null
      if (!gameId) return
      sound.unlock()
      sound.use(clipsFor(gameById(gameId)))
      persist({ game: gameId, level: id })
      screen = 'play'
      if (usingTouch()) void tryLandscapeLock()
      mount()
    })
  })

  app.querySelector<HTMLButtonElement>('[data-action="device"]')?.addEventListener('click', () => {
    screen = 'device'
    mount()
  })

  if (usingPad()) unwatch = watchMenuPad()
}

function watchMenuPad(): () => void {
  let row = Math.max(0, GAMES.findIndex((game) => game.id === save.game))
  let col = save.level ? save.level - 1 : 0
  let onDevice = false
  let faceWas = false
  let heldX = 0
  let heldY = 0
  let nextRepeat = 0
  let frame = 0
  let stopped = false
  let seenPad = false

  const tick = (): void => {
    if (stopped) return
    if (settingsOpen) {
      frame = requestAnimationFrame(tick)
      return
    }
    showMenuPick(row, col, onDevice)
    const snap = samplePads()
    if (snap.kind !== 'none') seenPad = true
    const label = menuPadLabel(snap, seenPad)
    const status = app.querySelector<HTMLElement>('[data-menu-pad]')
    if (status && status.textContent !== label) status.textContent = label
    if (snap.kind === 'ready' && snap.pad) {
      const move = menuAxis(snap.pad)
      const now = performance.now()
      const changed = move.x !== heldX || move.y !== heldY
      if (changed) {
        heldX = move.x
        heldY = move.y
        if (move.x !== 0 || move.y !== 0) {
          const next = stepMenu(row, col, onDevice, move.x, move.y)
          row = next.row
          col = next.col
          onDevice = next.onDevice
          nextRepeat = now + 420
        }
      } else if ((move.x !== 0 || move.y !== 0) && now >= nextRepeat) {
        const next = stepMenu(row, col, onDevice, move.x, move.y)
        row = next.row
        col = next.col
        onDevice = next.onDevice
        nextRepeat = now + 220
      }
      const face = padDown(snap.pad, 0)
      if (face && !faceWas) pressMenuPick()
      faceWas = face
    } else {
      faceWas = false
      heldX = 0
      heldY = 0
    }
    if (!stopped) frame = requestAnimationFrame(tick)
  }

  showMenuPick(row, col, onDevice)
  frame = requestAnimationFrame(tick)
  return () => {
    stopped = true
    cancelAnimationFrame(frame)
  }
}

function menuAxis(pad: Gamepad): { x: number; y: number } {
  const dead = 0.45
  let x = 0
  let y = 0
  if (padDown(pad, 14)) x -= 1
  if (padDown(pad, 15)) x += 1
  if (padDown(pad, 12)) y -= 1
  if (padDown(pad, 13)) y += 1
  const axisX = pad.axes[0] ?? 0
  const axisY = pad.axes[1] ?? 0
  if (x === 0) x = axisX < -dead ? -1 : axisX > dead ? 1 : 0
  if (y === 0) y = axisY < -dead ? -1 : axisY > dead ? 1 : 0
  return { x, y }
}

function stepMenu(
  row: number,
  col: number,
  onDevice: boolean,
  x: number,
  y: number,
): { row: number; col: number; onDevice: boolean } {
  if (onDevice) {
    if (y < 0) return { row: GAMES.length - 1, col, onDevice: false }
    return { row, col, onDevice }
  }
  const nextCol = Math.min(3, Math.max(0, col + x))
  if (y > 0 && row >= GAMES.length - 1) return { row, col: nextCol, onDevice: true }
  return { row: Math.min(GAMES.length - 1, Math.max(0, row + y)), col: nextCol, onDevice: false }
}

function menuPick(row: number, col: number, onDevice: boolean): HTMLButtonElement | null {
  if (onDevice) return app.querySelector<HTMLButtonElement>('[data-action="device"]')
  const game = GAMES[row]
  if (!game) return null
  return app.querySelector<HTMLButtonElement>(`[data-game="${game.id}"][data-level="${col + 1}"]`)
}

function showMenuPick(row: number, col: number, onDevice: boolean): void {
  app.querySelectorAll('.is-pick').forEach((item) => item.classList.remove('is-pick'))
  menuPick(row, col, onDevice)?.classList.add('is-pick')
}

function pressMenuPick(): void {
  const picked = app.querySelector<HTMLButtonElement>('.is-pick')
  picked?.click()
}

function paintPreview(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const preview = canvas.dataset.preview
  if (preview !== 'hen' && preview !== 'car') return
  const width = canvas.width
  const height = canvas.height
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (preview === 'hen') drawHenMark(ctx, width, height)
  else drawCarMark(ctx, width, height)
}

function mountPlay(): void {
  const copy = ui()
  const mini = gameById(save.game)
  sound.use(clipsFor(mini))
  const level = mini.levels.find((item) => item.id === save.level) ?? mini.levels[0]
  const touch = usingTouch()
  app.innerHTML = `
    <div class="play${touch ? ' is-touch' : ''}">
      <div class="stage">
        ${keybarMarkup(level, touch)}
        <canvas width="1280" height="720"></canvas>
        ${touch ? touchBarMarkup(level, iconFor, (cap) => faceFor(cap).label) : ''}
        <div class="overlay" data-pause hidden aria-hidden="true">
          <div class="panel">
            <h2>${copy.pause}</h2>
            <button class="choice" type="button" data-action="resume"><span class="choice-title">${copy.resume}</span></button>
            <button class="choice" type="button" data-action="menu"><span class="choice-title">${copy.switchLevel}</span></button>
            <button class="sound-btn" type="button" data-sound aria-label="${sound.muted ? copy.soundOn : copy.soundOff}">${soundIcon(sound.muted)}</button>
            <button class="choice" type="button" data-open-settings><span class="choice-title">${copy.settings}</span></button>
          </div>
        </div>
      </div>
      ${turnOverlayMarkup(copy.turnPhone, copy.turnPhoneHint)}
    </div>
    ${settingsMarkup()}
  `
  bindSettings()
  document.documentElement.classList.toggle('is-touch-play', touch)

  const canvas = app.querySelector<HTMLCanvasElement>('.stage canvas')
  const stage = app.querySelector<HTMLElement>('.stage')
  if (!canvas || !stage) return

  game = new Game(canvas, level, mini.id, sound, showPressed, usingPad(), () => {
    if (pauseOpen) closePause()
    else openPause()
  })
  if (touch) {
    bindTouchBar(
      app,
      (pointerId, action) => game?.holdPointer(pointerId, action),
      (pointerId) => game?.releasePointer(pointerId),
    )
    bindPlayGuards(app.querySelector<HTMLElement>('.play') ?? app)
    const play = app.querySelector<HTMLElement>('.play')
    if (play) pinPlaySurface(play, canvas)
  }
  game.start()
  unorient = watchOrientation()

  app.querySelector<HTMLButtonElement>('.icon-btn')?.addEventListener('click', openPause)
  app.querySelector<HTMLButtonElement>('[data-action="resume"]')?.addEventListener('click', closePause)
  app.querySelector<HTMLButtonElement>('[data-action="menu"]')?.addEventListener('click', () => {
    sound.unlock()
    screen = 'menu'
    mount()
  })
  app.querySelector<HTMLButtonElement>('[data-pause] [data-sound]')?.addEventListener('click', toggleSound)
}

function bindPlayGuards(root: HTMLElement): void {
  const block = (event: Event): void => {
    event.preventDefault()
  }
  root.addEventListener('contextmenu', block)
  root.addEventListener('dblclick', block)
  root.addEventListener('gesturestart', block as EventListener)
  root.addEventListener('gesturechange', block as EventListener)
  root.addEventListener('touchmove', block, { passive: false })
}

function syncTurnOverlay(): void {
  const overlay = app.querySelector<HTMLElement>('[data-turn]')
  const play = app.querySelector<HTMLElement>('.play')
  const blocked = screen === 'play' && needsLandscapePrompt()
  if (overlay) overlay.hidden = !blocked
  play?.classList.toggle('is-turned', blocked)
  document.documentElement.classList.toggle('is-phone-portrait', blocked)
  if (!game || blocked === turnBlocked) return
  turnBlocked = blocked
  if (blocked) game.setPaused(true)
  else if (!pauseOpen) game.setPaused(false)
}

function watchOrientation(): () => void {
  const playMove = (event: Event): void => {
    if (screen === 'play') event.preventDefault()
  }
  const sync = (): void => {
    window.scrollTo(0, 0)
    if (screen === 'play' && usingTouch()) {
      const play = app.querySelector<HTMLElement>('.play.is-touch')
      const canvas = app.querySelector<HTMLCanvasElement>('.stage canvas')
      if (play && canvas) pinPlaySurface(play, canvas)
    }
    syncTurnOverlay()
  }
  document.documentElement.addEventListener('touchmove', playMove, { passive: false })
  const stop = watchVisualViewport(sync)
  return () => {
    document.documentElement.removeEventListener('touchmove', playMove)
    stop()
  }
}

function capsFor(level: LevelConfig): KeyCap[] {
  return KEY_ORDER.filter((cap) => level.actions.some((action) => ACTION_CAP[action] === cap))
}

function keysMarkup(level: LevelConfig): string {
  return capsFor(level)
    .map((cap) => {
      const space = cap === 'space' && !usingPad() ? ' key-space' : ''
      return `<span class="key${space}" data-key="${cap}">${iconFor(cap)}</span>`
    })
    .join('')
}

function keybarMarkup(level: LevelConfig, compact = false): string {
  const pause = `<button class="icon-btn" type="button" aria-label="${ui().pause}"><span class="pause-bars"></span></button>`
  if (compact) return pause
  const label = capsFor(level).map((cap) => faceFor(cap).label).join(', ')
  return `
    <div class="keybar">
      ${pause}
      <div class="hint" aria-label="${label}">${keysMarkup(level)}</div>
    </div>
  `
}

function showPressed(caps: KeyCap[]): void {
  const active = new Set(caps)
  app.querySelectorAll<HTMLElement>('[data-key]').forEach((key) => {
    const cap = key.dataset.key
    key.classList.toggle('is-on', cap !== undefined && active.has(cap as KeyCap))
  })
}

function openPause(): void {
  if (!game || pauseOpen) return
  pauseOpen = true
  game.setPaused(true)
  app.querySelector('.stage')?.classList.add('is-paused')
  const overlay = app.querySelector<HTMLElement>('[data-pause]')
  if (overlay) {
    overlay.hidden = false
    overlay.removeAttribute('aria-hidden')
  }
  app.querySelector<HTMLButtonElement>('[data-action="resume"]')?.focus()
}

function closePause(): void {
  if (!game || !pauseOpen) return
  pauseOpen = false
  const overlay = app.querySelector<HTMLElement>('[data-pause]')
  if (overlay) {
    overlay.hidden = true
    overlay.setAttribute('aria-hidden', 'true')
  }
  app.querySelector('.stage')?.classList.remove('is-paused')
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  game.setPaused(turnBlocked)
}

const found = localeFromPath()
if (!found) {
  location.replace(localePath(detectLocale()))
} else {
  locale = found
  screen = 'intro'
  applyDocument()
  window.addEventListener('popstate', () => {
    const next = localeFromPath()
    if (next) locale = next
    screen = history.state?.screen === 'device' || history.state?.screen === 'menu' || history.state?.screen === 'play' ? history.state.screen : 'intro'
    applyDocument()
    mount()
  })
  mount()
}
