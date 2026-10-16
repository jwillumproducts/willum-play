import type { PadBrand } from './types'

export interface PadSnapshot {
  kind: 'none' | 'unread' | 'wait' | 'ready'
  brand: PadBrand | null
  model: string
  pad: Gamepad | null
  logoEdge: boolean
}

const SONY: Record<string, string> = {
  '05c4': 'DualShock 4',
  '09cc': 'DualShock 4',
  '0ce6': 'DualSense',
  '0df2': 'DualSense Edge',
}

const MICROSOFT: Record<string, string> = {
  '028e': 'Xbox 360',
  '028f': 'Xbox 360',
  '02a1': 'Xbox 360',
  '0719': 'Xbox 360',
  '02d1': 'Xbox One',
  '02dd': 'Xbox One',
  '02e3': 'Xbox One',
  '02ea': 'Xbox One',
  '02fd': 'Xbox One',
  '0b00': 'Xbox One',
  '0b05': 'Xbox One',
  '0b12': 'Xbox Series',
  '0b13': 'Xbox Series',
  '0b20': 'Xbox Series',
  '0b22': 'Xbox Series',
}

let confirmedKey: string | null = null
let logoWasDown = false

export function padDown(pad: Gamepad, index: number): boolean {
  const button = pad.buttons[index]
  return !!button && (button.pressed || button.value > 0.5)
}

export function samplePads(): PadSnapshot {
  const pads = navigator.getGamepads?.() ?? []
  const alive = [...pads].filter((pad): pad is Gamepad => !!pad && pad.connected)
  if (alive.length === 0) {
    confirmedKey = null
    logoWasDown = false
    return { kind: 'none', brand: null, model: '', pad: null, logoEdge: false }
  }

  const confirmed = confirmedKey ? alive.find((pad) => padKey(pad) === confirmedKey) : undefined
  const pad = confirmed ?? alive[0]
  if (!confirmed) confirmedKey = null

  const info = describe(pad)
  if (!info.standard) {
    logoWasDown = false
    return { kind: 'unread', brand: info.brand, model: info.model, pad, logoEdge: false }
  }

  const logo = padDown(pad, 16)
  const logoEdge = logo && !logoWasDown
  logoWasDown = logo
  if (logo) confirmedKey = padKey(pad)
  const ready = confirmedKey === padKey(pad)
  return { kind: ready ? 'ready' : 'wait', brand: info.brand, model: info.model, pad, logoEdge }
}

export function watchPads(onChange: (snap: PadSnapshot) => void): () => void {
  let frame = 0
  let last = ''
  let stopped = false
  const tick = (): void => {
    if (stopped) return
    const snap = samplePads()
    const key = `${snap.kind}|${snap.brand ?? ''}|${snap.model}|${snap.logoEdge ? '1' : '0'}`
    if (key !== last) {
      last = key
      onChange(snap)
    }
    if (!stopped) frame = requestAnimationFrame(tick)
  }
  const first = samplePads()
  last = `${first.kind}|${first.brand ?? ''}|${first.model}|${first.logoEdge ? '1' : '0'}`
  onChange(first)
  frame = requestAnimationFrame(tick)
  return () => {
    stopped = true
    cancelAnimationFrame(frame)
  }
}

function padKey(pad: Gamepad): string {
  return `${pad.index}:${pad.id}`
}

function describe(pad: Gamepad): { brand: PadBrand | null; model: string; standard: boolean } {
  const id = pad.id
  const parsed = parseIds(id)
  let brand: PadBrand | null = null
  let model = 'Controller'

  if (parsed?.vendor === '054c') {
    brand = 'playstation'
    model = SONY[parsed.product] ?? 'PlayStation'
  } else if (parsed?.vendor === '045e') {
    brand = 'xbox'
    model = MICROSOFT[parsed.product] ?? 'Xbox'
  } else if (/dualsense edge/i.test(id)) {
    brand = 'playstation'
    model = 'DualSense Edge'
  } else if (/dualsense/i.test(id)) {
    brand = 'playstation'
    model = 'DualSense'
  } else if (/dualshock/i.test(id)) {
    brand = 'playstation'
    model = 'DualShock 4'
  } else if (/playstation|wireless controller/i.test(id)) {
    brand = 'playstation'
    model = 'PlayStation'
  } else if (/xbox series|xbox wireless/i.test(id)) {
    brand = 'xbox'
    model = 'Xbox Series'
  } else if (/xbox 360/i.test(id)) {
    brand = 'xbox'
    model = 'Xbox 360'
  } else if (/xbox one/i.test(id)) {
    brand = 'xbox'
    model = 'Xbox One'
  } else if (/xbox/i.test(id)) {
    brand = 'xbox'
    model = 'Xbox'
  }

  const standard = pad.mapping === 'standard' || (pad.mapping === '' && brand !== null && pad.buttons.length >= 12)
  return { brand, model, standard }
}

function parseIds(id: string): { vendor: string; product: string } | null {
  const named = /Vendor:\s*([0-9a-f]{4})\s+Product:\s*([0-9a-f]{4})/i.exec(id)
  if (named) return { vendor: named[1].toLowerCase(), product: named[2].toLowerCase() }
  const compact = /\b([0-9a-f]{4})-([0-9a-f]{4})\b/i.exec(id)
  if (compact) return { vendor: compact[1].toLowerCase(), product: compact[2].toLowerCase() }
  return null
}
