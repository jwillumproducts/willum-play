import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

type Hit = { id: string; x: number; y: number; w: number; h: number; fontPt?: number }
type FontMark = { text: string; pt: number; role: 'head' | 'body' }
type Debug = {
  screen: string
  overlay: string | null
  scale: number
  layout: { viewW: number; viewH: number; mode: string; scale: number }
  hits: Hit[]
  fonts: FontMark[]
  taps: { id: string; w: number; h: number }[]
  pads: { id: string; w: number; h: number }[]
  minFont: number
  minHead: number
  minBody: number
  minTap: number
}

const SHOT = '/cursor/stores/self/willum-ux'
const REPORT: Record<string, unknown> = {}

const VIEWPORTS = [
  { name: 'iphone16-852x329', width: 852, height: 329, touch: true, dpr: 3 },
  { name: 'iphone-se-667x375', width: 667, height: 375, touch: true, dpr: 2 },
  { name: 'iphone16-852x393', width: 852, height: 393, touch: true, dpr: 3 },
  { name: 'iphone16-393x852', width: 393, height: 852, touch: true, dpr: 3 },
  { name: 'ipad-1180x820', width: 1180, height: 820, touch: true, dpr: 2 },
  { name: 'ipad-820x1180', width: 820, height: 1180, touch: true, dpr: 2 },
  { name: 'ipad-1024x768', width: 1024, height: 768, touch: true, dpr: 2 },
  { name: 'desktop-1280x800', width: 1280, height: 800, touch: false, dpr: 1 },
] as const

async function debug(page: Page): Promise<Debug> {
  await page.waitForFunction(() => Boolean((window as unknown as { __willum?: Debug }).__willum))
  await page.waitForTimeout(40)
  return page.evaluate(() => (window as unknown as { __willum: Debug }).__willum)
}

async function tapId(page: Page, id: string, touch: boolean): Promise<void> {
  const hit = await page.waitForFunction((target) => {
    const w = (window as unknown as { __willum?: Debug }).__willum
    return w?.hits.find((h) => h.id === target) ?? null
  }, id)
  const box = await page.locator('#stage').boundingBox()
  const info = await hit.jsonValue()
  if (!box || !info) throw new Error(`mangler hit ${id}`)
  const x = box.x + info.x + info.w / 2
  const y = box.y + info.y + info.h / 2
  if (touch) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
  await page.waitForTimeout(80)
}

function assertMenuSizes(label: string, data: Debug): void {
  expect(data.minFont, `${label} min font`).toBeGreaterThanOrEqual(16)
  expect(data.minBody, `${label} body`).toBeGreaterThanOrEqual(16)
  expect(data.minHead, `${label} heading`).toBeGreaterThanOrEqual(22)
  expect(data.minTap, `${label} tap`).toBeGreaterThanOrEqual(64)
  for (const tap of data.taps) {
    expect(tap.w, `${label} ${tap.id} w`).toBeGreaterThanOrEqual(64)
    expect(tap.h, `${label} ${tap.id} h`).toBeGreaterThanOrEqual(64)
  }
  for (const font of data.fonts) {
    expect(font.pt, `${label} ${font.text}`).toBeGreaterThanOrEqual(font.role === 'head' ? 22 : 16)
  }
}

function snapshotSizes(data: Debug) {
  return {
    scale: Number(data.scale.toFixed(3)),
    mode: data.layout.mode,
    view: `${data.layout.viewW}x${data.layout.viewH}`,
    minFont: data.minFont,
    minHead: data.minHead,
    minBody: data.minBody,
    minTap: data.minTap,
    fonts: data.fonts,
    taps: data.taps,
    pads: data.pads,
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
    await page.goto('/da/')
    const intro = await debug(page)
    expect(intro.screen).toBe('intro')
    assertMenuSizes(`${vp.name} intro`, intro)
    await shot(page, vp.name, '01-intro')

    await tapId(page, 'cta-device', vp.touch)
    const device = await debug(page)
    expect(device.screen).toBe('device')
    assertMenuSizes(`${vp.name} device`, device)
    await shot(page, vp.name, '02-device')

    await tapId(page, 'dev-tablet', vp.touch)
    const picker = await debug(page)
    expect(picker.screen).toBe('menu')
    assertMenuSizes(`${vp.name} picker`, picker)
    await shot(page, vp.name, '03-picker')

    await tapId(page, 'level-hen-1', vp.touch)
    const play = await debug(page)
    expect(play.screen).toBe('play')
    await shot(page, vp.name, '04-play-l1')

    if (play.pads.length) {
      const dir = play.pads.filter((p) => p.id.includes('move'))
      const jump = play.pads.filter((p) => p.id.includes('jump') || p.id.includes('brake') || p.id.includes('interact'))
      const pause = play.pads.find((p) => p.id.includes('pause'))
      for (const d of dir) {
        expect(d.w, `${vp.name} ${d.id}`).toBeGreaterThanOrEqual(64)
        expect(d.h).toBeGreaterThanOrEqual(64)
      }
      for (const a of jump) {
        expect(a.w, `${vp.name} ${a.id}`).toBeGreaterThanOrEqual(80)
        expect(a.h).toBeGreaterThanOrEqual(80)
        expect(a.w).toBeLessThanOrEqual(88)
      }
      if (pause) {
        expect(pause.w).toBeGreaterThanOrEqual(44)
        expect(pause.h).toBeGreaterThanOrEqual(44)
      }
    }

    if (play.pads.find((p) => p.id === 'pad-pause')) await tapId(page, 'pad-pause', vp.touch)
    else {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(80)
    }
    const pauseMenu = await debug(page)
    expect(pauseMenu.overlay).toBe('pause')
    assertMenuSizes(`${vp.name} pause`, pauseMenu)
    await shot(page, vp.name, '05-pause')

    await tapId(page, 'open-settings', vp.touch)
    const settings = await debug(page)
    expect(settings.overlay).toBe('settings')
    assertMenuSizes(`${vp.name} settings`, settings)
    await shot(page, vp.name, '06-settings')

    await tapId(page, 'lang-en', vp.touch)
    const en = await debug(page)
    assertMenuSizes(`${vp.name} lang-en`, en)
    await shot(page, vp.name, '07-lang-en')

    REPORT[vp.name] = {
      intro: snapshotSizes(intro),
      device: snapshotSizes(device),
      picker: snapshotSizes(picker),
      play: snapshotSizes(play),
      pause: snapshotSizes(pauseMenu),
      settings: snapshotSizes(settings),
    }

    await context.close()
  })
}

test.afterAll(() => {
  fs.mkdirSync(SHOT, { recursive: true })
  fs.writeFileSync(path.join(SHOT, 'pt-report.json'), JSON.stringify(REPORT, null, 2))
})
