import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

type Hit = { id: string; x: number; y: number; w: number; h: number; fontPt?: number }
type FontMark = { text: string; pt: number; role: 'head' | 'body' }
type Chicken = {
  x: number
  y: number
  vx: number
  vy: number
  onGround: boolean
  moving: boolean
  braking: boolean
  peck: number
  camX: number
  camY: number
  actions: string[]
}
type Debug = {
  screen: string
  overlay: string | null
  overlayBack?: string | null
  locale?: string
  scale: number
  layout: {
    viewW: number
    viewH: number
    mode: string
    scale: number
    sceneX: number
    sceneY: number
    sceneW: number
    sceneH: number
    fillView?: boolean
    leftBar?: number
    rightBar?: number
  }
  hits: Hit[]
  fonts: FontMark[]
  taps: { id: string; w: number; h: number }[]
  pads: { id: string; w: number; h: number }[]
  langs?: { id: string; x: number; y: number; w: number; h: number }[]
  chicken?: Chicken | null
  minFont: number
  minHead: number
  minBody: number
  minTap: number
  minLang?: number
  scene?: { x: number; y: number; w: number; h: number; viewW: number; viewH: number; mode: string }
  clusters?: {
    scene: { x: number; y: number; w: number; h: number }
    dpad: { x: number; y: number; w: number; h: number }
    action: { x: number; y: number; w: number; h: number }
    origin: { x: number; y: number }
  } | null
  page?: { scrollHeight: number; clientHeight: number; innerHeight: number; scrollY: number }
}

const SHOT = '/cursor/stores/self/willum-ux'
const REPORT: Record<string, unknown> = {}
const LOCALES = ['da', 'en', 'es', 'de', 'zh', 'hi', 'fr'] as const

const VIEWPORTS = [
  { name: 'iphone16-safari-port-393x660', width: 393, height: 660, touch: true, dpr: 3, staleClient: false },
  { name: 'iphone16-safari-land-852x300', width: 852, height: 300, touch: true, dpr: 3, staleClient: true },
  { name: 'iphone16-852x329', width: 852, height: 329, touch: true, dpr: 3, staleClient: false },
  { name: 'iphone-se-667x375', width: 667, height: 375, touch: true, dpr: 2, staleClient: false },
  { name: 'iphone16-852x393', width: 852, height: 393, touch: true, dpr: 3, staleClient: false },
  { name: 'iphone16-393x852', width: 393, height: 852, touch: true, dpr: 3, staleClient: false },
  { name: 'ipad-1180x820', width: 1180, height: 820, touch: true, dpr: 2, staleClient: false },
  { name: 'ipad-820x1180', width: 820, height: 1180, touch: true, dpr: 2, staleClient: false },
  { name: 'ipad-1024x768', width: 1024, height: 768, touch: true, dpr: 2, staleClient: false },
  { name: 'desktop-1280x800', width: 1280, height: 800, touch: false, dpr: 1, staleClient: false },
] as const

const LEVEL_VPS = VIEWPORTS.filter(
  (vp) => vp.name === 'iphone16-safari-port-393x660' || vp.name === 'iphone16-safari-land-852x300' || vp.name === 'iphone16-852x329',
)

const LEVELS: { game: 'hen' | 'car'; id: 1 | 2 | 3 | 4; actions: string[] }[] = [
  { game: 'hen', id: 1, actions: ['moveLeft', 'moveRight'] },
  { game: 'hen', id: 2, actions: ['moveLeft', 'moveRight', 'jump'] },
  { game: 'hen', id: 3, actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown'] },
  { game: 'hen', id: 4, actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'interact'] },
  { game: 'car', id: 1, actions: ['moveLeft', 'moveRight'] },
  { game: 'car', id: 2, actions: ['moveLeft', 'moveRight', 'brake'] },
  { game: 'car', id: 3, actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown'] },
  { game: 'car', id: 4, actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'interact'] },
]

async function debug(page: Page): Promise<Debug> {
  await page.waitForFunction(() => Boolean((window as unknown as { __willum?: Debug }).__willum))
  await page.waitForTimeout(50)
  return page.evaluate(() => (window as unknown as { __willum: Debug }).__willum)
}

async function hitBox(page: Page, id: string): Promise<Hit> {
  const hit = await page.waitForFunction((target) => {
    const w = (window as unknown as { __willum?: Debug }).__willum
    return w?.hits.find((h) => h.id === target) ?? null
  }, id)
  const info = await hit.jsonValue()
  if (!info) throw new Error(`mangler hit ${id}`)
  return info
}

async function tapId(page: Page, id: string, touch: boolean): Promise<void> {
  const info = await hitBox(page, id)
  const box = await page.locator('#stage').boundingBox()
  if (!box) throw new Error('mangler canvas')
  const x = box.x + info.x + info.w / 2
  const y = box.y + info.y + info.h / 2
  if (touch) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
  await page.waitForTimeout(80)
}

async function holdId(page: Page, id: string, ms: number): Promise<void> {
  const info = await hitBox(page, id)
  const box = await page.locator('#stage').boundingBox()
  if (!box) throw new Error('mangler canvas')
  const x = box.x + info.x + info.w / 2
  const y = box.y + info.y + info.h / 2
  await page.evaluate(
    ({ x, y }) => {
      const canvas = document.getElementById('stage')
      if (!canvas) throw new Error('stage')
      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId: 42,
          pointerType: 'touch',
        }),
      )
    },
    { x, y },
  )
  await page.waitForTimeout(ms)
  await page.evaluate(
    ({ x, y }) => {
      const canvas = document.getElementById('stage')
      if (!canvas) throw new Error('stage')
      canvas.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId: 42,
          pointerType: 'touch',
        }),
      )
    },
    { x, y },
  )
  await page.waitForTimeout(40)
}

function assertMenuSizes(label: string, data: Debug, minTap = 64): void {
  expect(data.minFont, `${label} min font`).toBeGreaterThanOrEqual(16)
  expect(data.minBody, `${label} body`).toBeGreaterThanOrEqual(16)
  expect(data.minHead, `${label} heading`).toBeGreaterThanOrEqual(22)
  expect(data.minTap, `${label} tap`).toBeGreaterThanOrEqual(minTap)
  for (const tap of data.taps) {
    expect(tap.w, `${label} ${tap.id} w`).toBeGreaterThanOrEqual(minTap)
    expect(tap.h, `${label} ${tap.id} h`).toBeGreaterThanOrEqual(minTap)
  }
  for (const font of data.fonts) {
    expect(font.pt, `${label} ${font.text}`).toBeGreaterThanOrEqual(font.role === 'head' ? 22 : 16)
  }
}

function assertInsideScene(label: string, data: Debug, ids?: string[]): void {
  const sx = data.layout.sceneX
  const sy = data.layout.sceneY
  const sw = data.layout.sceneW
  const sh = data.layout.sceneH
  const list = ids
    ? data.hits.filter((h) => ids.some((id) => h.id === id || h.id.startsWith(id)))
    : data.hits.filter((h) => !h.id.startsWith('pad-') && h.id !== 'lang-open')
  for (const h of list) {
    expect(h.x, `${label} ${h.id} left`).toBeGreaterThanOrEqual(sx - 1)
    expect(h.y, `${label} ${h.id} top`).toBeGreaterThanOrEqual(sy - 1)
    expect(h.x + h.w, `${label} ${h.id} right`).toBeLessThanOrEqual(sx + sw + 1)
    expect(h.y + h.h, `${label} ${h.id} bottom`).toBeLessThanOrEqual(sy + sh + 1)
  }
}

function assertInsideView(label: string, data: Debug, hits: Hit[]): void {
  for (const h of hits) {
    expect(h.x, `${label} ${h.id} left`).toBeGreaterThanOrEqual(-1)
    expect(h.y, `${label} ${h.id} top`).toBeGreaterThanOrEqual(-1)
    expect(h.x + h.w, `${label} ${h.id} right`).toBeLessThanOrEqual(data.layout.viewW + 1)
    expect(h.y + h.h, `${label} ${h.id} bottom`).toBeLessThanOrEqual(data.layout.viewH + 1)
  }
}

function langIds(data: Debug): string[] {
  return data.hits.filter((h) => h.id.startsWith('lang-')).map((h) => h.id)
}

function assertIntroFlags(label: string, data: Debug): void {
  const ids = langIds(data)
  expect(ids, `${label} full flag row`).toEqual(LOCALES.map((code) => `lang-${code}`))
  expect(ids.includes('lang-open'), `${label} no corner flag`).toBe(false)
  for (const code of LOCALES) {
    const hit = data.hits.find((h) => h.id === `lang-${code}`)
    expect(hit, `${label} ${code}`).toBeTruthy()
    if (hit) {
      expect(hit.w).toBeGreaterThanOrEqual(64)
      expect(hit.h).toBeGreaterThanOrEqual(64)
    }
  }
}

function assertCornerFlag(label: string, data: Debug): void {
  const open = data.hits.find((h) => h.id === 'lang-open')
  expect(open, `${label} corner flag`).toBeTruthy()
  if (!open) return
  expect(open.w, `${label} flag w`).toBeGreaterThanOrEqual(44)
  expect(open.h, `${label} flag h`).toBeGreaterThanOrEqual(44)
  assertInsideView(`${label} flag`, data, [open])
  expect(open.x, `${label} flag right`).toBeGreaterThan(data.layout.viewW * 0.55)
  expect(open.y, `${label} flag top`).toBeLessThan(data.layout.viewH * 0.35)
  for (const code of LOCALES) {
    expect(data.hits.find((h) => h.id === `lang-${code}`), `${label} no full row ${code}`).toBeFalsy()
  }
  const pause = data.hits.find((h) => h.id === 'pad-pause')
  if (pause) {
    const overlap = !(open.x + open.w <= pause.x || pause.x + pause.w <= open.x || open.y + open.h <= pause.y || pause.y + pause.h <= open.y)
    expect(overlap, `${label} flag vs pause`).toBe(false)
  }
}

function assertLangPopup(label: string, data: Debug): void {
  expect(data.overlay, `${label} overlay`).toBe('lang')
  for (const code of LOCALES) {
    const hit = data.hits.find((h) => h.id === `lang-${code}`)
    expect(hit, `${label} popup ${code}`).toBeTruthy()
    if (!hit) continue
    expect(hit.w).toBeGreaterThanOrEqual(44)
    expect(hit.h).toBeGreaterThanOrEqual(44)
  }
  assertInsideScene(label, data, LOCALES.map((code) => `lang-${code}`))
}

function assertPadsForActions(label: string, data: Debug, actions: string[]): void {
  const pads = data.hits.filter((h) => h.id.startsWith('pad-'))
  const ids = pads.map((h) => h.id.replace('pad-', ''))
  expect(ids.sort(), `${label} pad set`).toEqual(['pause', ...actions].sort())
  for (const pad of pads) {
    const min = pad.id === 'pad-pause' ? 44 : pad.id.includes('move') ? 64 : 80
    expect(pad.w, `${label} ${pad.id} w`).toBeGreaterThanOrEqual(min)
    expect(pad.h, `${label} ${pad.id} h`).toBeGreaterThanOrEqual(min)
    assertInsideView(`${label} ${pad.id}`, data, [pad])
  }
  if (data.layout.mode === 'sidebars') {
    for (const pad of pads) {
      if (pad.id === 'pad-pause') continue
      if (pad.id.includes('move')) {
        expect(pad.x + pad.w, `${label} ${pad.id} stays in left bar`).toBeLessThanOrEqual(data.layout.sceneX + 1)
      } else {
        expect(pad.x, `${label} ${pad.id} stays in right bar`).toBeGreaterThanOrEqual(data.layout.sceneX + data.layout.sceneW - 1)
      }
    }
  }
}

function snapshotSizes(data: Debug) {
  return {
    scale: Number(data.scale.toFixed(3)),
    mode: data.layout.mode,
    fillView: data.layout.fillView,
    view: `${data.layout.viewW}x${data.layout.viewH}`,
    scene: `${Math.round(data.layout.sceneW)}x${Math.round(data.layout.sceneH)} @${Math.round(data.layout.sceneX)},${Math.round(data.layout.sceneY)}`,
    locale: data.locale,
    overlay: data.overlay,
    minFont: data.minFont,
    minHead: data.minHead,
    minBody: data.minBody,
    minTap: data.minTap,
    fonts: data.fonts,
    taps: data.taps,
    pads: data.pads,
    langs: data.langs,
  }
}

async function shot(page: Page, folder: string, name: string): Promise<void> {
  const dir = path.join(SHOT, folder)
  fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false })
}

test.describe.configure({ mode: 'serial' })

for (const vp of VIEWPORTS) {
  test(`UX ${vp.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: vp.touch,
      isMobile: vp.touch,
      locale: 'da-DK',
    })
    const page = await context.newPage()
    if (vp.staleClient) {
      await page.addInitScript(() => {
        Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 393 })
        Object.defineProperty(document.documentElement, 'clientHeight', { get: () => 852 })
      })
    }
    await page.goto('/da/')
    const intro = await debug(page)
    expect(intro.screen).toBe('intro')
    expect(intro.layout.viewW, `${vp.name} viewW`).toBeCloseTo(vp.width, 0)
    expect(intro.layout.viewH, `${vp.name} viewH`).toBeCloseTo(vp.height, 0)
    assertMenuSizes(`${vp.name} intro`, intro)
    assertInsideScene(`${vp.name} intro`, intro)
    assertIntroFlags(`${vp.name} intro`, intro)
    await shot(page, vp.name, '01-intro')

    await tapId(page, 'cta-device', vp.touch)
    const device = await debug(page)
    expect(device.screen).toBe('device')
    assertMenuSizes(`${vp.name} device`, device)
    assertInsideScene(`${vp.name} device`, device)
    assertCornerFlag(`${vp.name} device`, device)
    const tablet = device.hits.find((h) => h.id === 'dev-tablet')
    expect(tablet, `${vp.name} tablet button`).toBeTruthy()
    if (tablet) expect(tablet.x + tablet.w).toBeLessThanOrEqual(device.layout.sceneW + device.layout.sceneX + 1)
    await shot(page, vp.name, '02-device')
    await shot(page, vp.name, '08-corner-flag-device')

    await tapId(page, 'lang-open', vp.touch)
    const deviceLang = await debug(page)
    assertLangPopup(`${vp.name} device popup`, deviceLang)
    await shot(page, vp.name, '09-lang-popup-device')
    await tapId(page, 'lang-en', vp.touch)
    const deviceEn = await debug(page)
    expect(deviceEn.screen, `${vp.name} stay on device`).toBe('device')
    expect(deviceEn.overlay).not.toBe('lang')
    expect(deviceEn.locale).toBe('en')
    assertCornerFlag(`${vp.name} device en`, deviceEn)

    await tapId(page, 'dev-tablet', vp.touch)
    const picker = await debug(page)
    expect(picker.screen).toBe('menu')
    assertMenuSizes(`${vp.name} picker`, picker, 44)
    assertInsideScene(`${vp.name} picker`, picker)
    assertCornerFlag(`${vp.name} picker`, picker)
    await shot(page, vp.name, '03-picker')

    await tapId(page, 'lang-open', vp.touch)
    const pickerLang = await debug(page)
    assertLangPopup(`${vp.name} picker popup`, pickerLang)
    await tapId(page, 'lang-da', vp.touch)
    const pickerDa = await debug(page)
    expect(pickerDa.screen).toBe('menu')
    expect(pickerDa.locale).toBe('da')

    await tapId(page, 'level-hen-1', vp.touch)
    const play = await debug(page)
    expect(play.screen).toBe('play')
    expect(play.chicken?.camX ?? 0).toBe(0)
    expect(play.chicken?.camY ?? 0).toBe(0)
    await shot(page, vp.name, '04-play-l1')
    if (play.pads.length) {
      assertPadsForActions(`${vp.name} hen-1`, play, ['moveLeft', 'moveRight'])
      assertCornerFlag(`${vp.name} play`, play)
    }

    if (play.pads.find((p) => p.id === 'pad-pause')) await tapId(page, 'pad-pause', vp.touch)
    else {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(80)
    }
    const pauseMenu = await debug(page)
    expect(pauseMenu.overlay).toBe('pause')
    assertMenuSizes(`${vp.name} pause`, pauseMenu)
    assertInsideScene(`${vp.name} pause`, pauseMenu, ['resume', 'to-menu', 'pause-sound', 'open-settings'])
    assertCornerFlag(`${vp.name} pause`, pauseMenu)
    await shot(page, vp.name, '05-pause')

    await tapId(page, 'lang-open', vp.touch)
    const pauseLang = await debug(page)
    assertLangPopup(`${vp.name} pause popup`, pauseLang)
    await tapId(page, 'lang-fr', vp.touch)
    const pauseFr = await debug(page)
    expect(pauseFr.screen).toBe('play')
    expect(pauseFr.overlay).toBe('pause')
    expect(pauseFr.locale).toBe('fr')

    await tapId(page, 'open-settings', vp.touch)
    const settings = await debug(page)
    expect(settings.overlay).toBe('settings')
    assertMenuSizes(`${vp.name} settings`, settings)
    assertInsideScene(`${vp.name} settings`, settings, ['set-'])
    assertCornerFlag(`${vp.name} settings`, settings)
    await shot(page, vp.name, '06-settings')

    await tapId(page, 'lang-open', vp.touch)
    const settingsLang = await debug(page)
    assertLangPopup(`${vp.name} settings popup`, settingsLang)
    await tapId(page, 'lang-en', vp.touch)
    const settingsEn = await debug(page)
    expect(settingsEn.overlay).toBe('settings')
    expect(settingsEn.locale).toBe('en')
    await shot(page, vp.name, '07-lang-en')

    REPORT[vp.name] = {
      intro: snapshotSizes(intro),
      device: snapshotSizes(device),
      picker: snapshotSizes(picker),
      play: snapshotSizes(play),
      pause: snapshotSizes(pauseMenu),
      settings: snapshotSizes(settingsEn),
    }

    await context.close()
  })
}

for (const vp of LEVEL_VPS) {
  test(`levels ${vp.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: true,
      isMobile: true,
      locale: 'da-DK',
    })
    const page = await context.newPage()
    if (vp.staleClient) {
      await page.addInitScript(() => {
        Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 393 })
        Object.defineProperty(document.documentElement, 'clientHeight', { get: () => 852 })
      })
    }
    await page.goto('/da/')
    await tapId(page, 'cta-device', true)
    await tapId(page, 'dev-tablet', true)

    for (const level of LEVELS) {
      await tapId(page, `level-${level.game}-${level.id}`, true)
      const play = await debug(page)
      expect(play.screen, `${vp.name} ${level.game}-${level.id}`).toBe('play')
      expect(play.chicken?.camX ?? 0).toBe(0)
      expect(play.chicken?.camY ?? 0).toBe(0)
      if (play.pads.length) {
        assertPadsForActions(`${vp.name} ${level.game}-${level.id}`, play, level.actions)
        await provePads(page, play, level.actions)
      }
      await shot(page, vp.name, `play-${level.game}-${level.id}`)
      if (play.pads.find((p) => p.id === 'pad-pause')) await tapId(page, 'pad-pause', true)
      else await page.keyboard.press('Escape')
      await tapId(page, 'to-menu', true)
    }

    await context.close()
  })
}

function roundRect(rect: { x: number; y: number; w: number; h: number }) {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    w: Math.round(rect.w),
    h: Math.round(rect.h),
  }
}

const LAYOUT_VPS = [
  { name: 'iphone16-safari-land-852x300', width: 852, height: 300, staleClient: true },
  { name: 'iphone16-852x329', width: 852, height: 329, staleClient: false },
  { name: 'ipad-1180x820', width: 1180, height: 820, staleClient: false },
] as const

for (const vp of LAYOUT_VPS) {
  test(`stable layout ${vp.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
      locale: 'da-DK',
    })
    const page = await context.newPage()
    if (vp.staleClient) {
      await page.addInitScript(() => {
        Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 393 })
        Object.defineProperty(document.documentElement, 'clientHeight', { get: () => 852 })
      })
    }
    await page.goto('/da/')
    await tapId(page, 'cta-device', true)
    await tapId(page, 'dev-tablet', true)

    let firstScene: ReturnType<typeof roundRect> | null = null
    let firstDpad: ReturnType<typeof roundRect> | null = null
    let firstLeft: ReturnType<typeof roundRect> | null = null
    let firstRight: ReturnType<typeof roundRect> | null = null
    let firstAction: ReturnType<typeof roundRect> | null = null

    for (const level of LEVELS) {
      await tapId(page, `level-${level.game}-${level.id}`, true)
      const play = await debug(page)
      expect(play.screen).toBe('play')
      expect(play.clusters, `${vp.name} clusters`).toBeTruthy()
      const scene = roundRect(play.clusters!.scene)
      const dpad = roundRect(play.clusters!.dpad)
      const left = play.hits.find((h) => h.id === 'pad-moveLeft')
      const right = play.hits.find((h) => h.id === 'pad-moveRight')
      expect(left, `${vp.name} ${level.game}-${level.id} left`).toBeTruthy()
      expect(right, `${vp.name} ${level.game}-${level.id} right`).toBeTruthy()
      if (!firstScene) {
        firstScene = scene
        firstDpad = dpad
        firstLeft = roundRect(left!)
        firstRight = roundRect(right!)
        firstAction = roundRect(play.clusters!.action)
      } else {
        expect(scene, `${vp.name} ${level.game}-${level.id} scene`).toEqual(firstScene)
        expect(dpad, `${vp.name} ${level.game}-${level.id} dpad`).toEqual(firstDpad)
        expect(roundRect(left!), `${vp.name} ${level.game}-${level.id} left`).toEqual(firstLeft)
        expect(roundRect(right!), `${vp.name} ${level.game}-${level.id} right`).toEqual(firstRight)
        expect(roundRect(play.clusters!.action), `${vp.name} ${level.game}-${level.id} action slot`).toEqual(firstAction)
      }
      if (play.pads.find((p) => p.id === 'pad-pause')) await tapId(page, 'pad-pause', true)
      else await page.keyboard.press('Escape')
      await tapId(page, 'to-menu', true)
    }

    await context.close()
  })
}

const PICKER_VPS = [
  { name: 'iphone16-safari-land-852x300', width: 852, height: 300, staleClient: true },
  { name: 'iphone16-852x329', width: 852, height: 329, staleClient: false },
] as const

for (const vp of PICKER_VPS) {
  test(`picker fits ${vp.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
      locale: 'da-DK',
    })
    const page = await context.newPage()
    if (vp.staleClient) {
      await page.addInitScript(() => {
        Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 393 })
        Object.defineProperty(document.documentElement, 'clientHeight', { get: () => 852 })
      })
    }
    await page.goto('/da/')
    await tapId(page, 'cta-device', true)
    await tapId(page, 'dev-tablet', true)
    const picker = await debug(page)
    expect(picker.screen).toBe('menu')
    const lastRow = picker.hits.filter((h) => h.id.startsWith('level-car-'))
    expect(lastRow.length).toBe(4)
    assertInsideView(`${vp.name} picker last row`, picker, lastRow)
    const foot = picker.hits.filter((h) => h.id === 'back-device' || h.id === 'open-settings')
    expect(foot.length).toBe(2)
    assertInsideView(`${vp.name} picker footer`, picker, foot)
    for (const h of [...lastRow, ...foot]) {
      expect(h.y + h.h, `${vp.name} ${h.id} bottom`).toBeLessThanOrEqual(picker.layout.viewH + 1)
      expect(h.y, `${vp.name} ${h.id} top`).toBeGreaterThanOrEqual(-1)
    }
    const pageBox = picker.page
    expect(pageBox, `${vp.name} page metrics`).toBeTruthy()
    if (pageBox) {
      expect(pageBox.scrollHeight, `${vp.name} scrollHeight`).toBeLessThanOrEqual(pageBox.innerHeight + 1)
      expect(pageBox.scrollY).toBe(0)
    }
    const measured = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }))
    expect(measured.scrollHeight).toBeLessThanOrEqual(measured.innerHeight + 1)
    await shot(page, vp.name, '03-picker-fit')
    await context.close()
  })
}

async function provePads(page: Page, play: Debug, actions: string[]): Promise<void> {
  if (play.layout.portrait) return
  for (const action of actions) {
    const before = (await debug(page)).chicken
    if (!before) continue
    await holdId(page, `pad-${action}`, 220)
    const after = (await debug(page)).chicken
    if (!after) continue
    if (action === 'moveRight') expect(after.x, 'right moves').toBeGreaterThan(before.x + 4)
    else if (action === 'moveLeft') expect(after.x, 'left moves').toBeLessThan(before.x - 4)
    else if (action === 'moveDown') expect(after.y, 'down moves').toBeGreaterThan(before.y + 4)
    else if (action === 'moveUp') expect(after.y, 'up moves').toBeLessThan(before.y - 4)
    else if (action === 'jump') expect(after.onGround === false || after.vy < 0, 'jump').toBe(true)
    else if (action === 'brake') expect(after.braking, 'brake').toBe(true)
    else if (action === 'interact') expect(after.peck, 'interact').toBeGreaterThanOrEqual(0)
  }
}

test.afterAll(() => {
  fs.mkdirSync(SHOT, { recursive: true })
  fs.writeFileSync(path.join(SHOT, 'pt-report.json'), JSON.stringify(REPORT, null, 2))
})
