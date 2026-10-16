import type { DeviceChoice, GameId, LevelId, PadBrand } from './types'

const KEY = 'willum-play'
const OLD_KEY = 'miniplay'

export interface SaveData {
  device: DeviceChoice | null
  pad: PadBrand | null
  game: GameId | null
  level: LevelId | null
  muted: boolean
}

const EMPTY: SaveData = {
  device: null,
  pad: null,
  game: null,
  level: null,
  muted: false,
}

function isLevel(value: unknown): value is LevelId {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isGame(value: unknown): value is GameId {
  return value === 'hen' || value === 'car'
}

function isDevice(value: unknown): value is DeviceChoice {
  return value === 'computer' || value === 'controller' || value === 'tablet'
}

function readRaw(): string | null {
  const current = localStorage.getItem(KEY)
  if (current) return current
  const legacy = localStorage.getItem(OLD_KEY)
  if (!legacy) return null
  localStorage.setItem(KEY, legacy)
  localStorage.removeItem(OLD_KEY)
  return legacy
}

export function loadSave(): SaveData {
  try {
    const raw = readRaw()
    if (!raw) return { ...EMPTY }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY }
    const data = parsed as Partial<SaveData>
    return {
      device: isDevice(data.device) ? data.device : null,
      pad: data.pad === 'playstation' || data.pad === 'xbox' ? data.pad : null,
      game: isGame(data.game) ? data.game : isLevel(data.level) ? 'hen' : null,
      level: isLevel(data.level) ? data.level : null,
      muted: data.muted === true,
    }
  } catch {
    return { ...EMPTY }
  }
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}
