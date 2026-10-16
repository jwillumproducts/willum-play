import type { LevelConfig, LevelId } from './types'

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Gå',
    camera: 'side',
    actions: ['moveLeft', 'moveRight'],
    hintActions: ['moveLeft', 'moveRight'],
    hint: 'arrows-x',
    hintLabel: 'Pil til venstre og pil til højre',
    note: 'Højre og venstre · set fra siden',
  },
  {
    id: 2,
    name: 'Hop',
    camera: 'side',
    actions: ['moveLeft', 'moveRight', 'jump'],
    hintActions: ['jump'],
    hint: 'space',
    hintLabel: 'Mellemrum',
    note: 'Mellemrum · set fra siden',
  },
  {
    id: 3,
    name: 'Fire retninger',
    camera: 'top',
    actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown'],
    hintActions: ['moveUp', 'moveDown'],
    hint: 'arrows-y',
    hintLabel: 'Pil op og pil ned',
    note: 'Op og ned · set ovenfra',
  },
  {
    id: 4,
    name: 'Handling',
    camera: 'top',
    actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'interact'],
    hintActions: ['interact'],
    hint: 'enter',
    hintLabel: 'Enter',
    note: 'Enter · set ovenfra',
  },
]

export function levelById(id: LevelId): LevelConfig {
  const level = LEVELS.find((item) => item.id === id)
  if (!level) return LEVELS[0]
  return level
}

export const CAR_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Kør',
    camera: 'side',
    actions: ['moveLeft', 'moveRight'],
    hintActions: ['moveLeft', 'moveRight'],
    hint: 'arrows-x',
    hintLabel: 'Pil til venstre og pil til højre',
    note: 'Kør til siderne · set fra siden',
  },
  {
    id: 2,
    name: 'Brems',
    camera: 'side',
    actions: ['moveLeft', 'moveRight', 'brake'],
    hintActions: ['brake'],
    hint: 'space',
    hintLabel: 'Mellemrum',
    note: 'Mellemrum bremser · set fra siden',
  },
  {
    id: 3,
    name: 'Kør rundt',
    camera: 'top',
    actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown'],
    hintActions: ['moveUp', 'moveDown'],
    hint: 'arrows-y',
    hintLabel: 'Pil op og pil ned',
    note: 'Kør i alle retninger · set ovenfra',
  },
  {
    id: 4,
    name: 'Dyt',
    camera: 'top',
    actions: ['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'interact'],
    hintActions: ['interact'],
    hint: 'enter',
    hintLabel: 'Enter',
    note: 'Enter dytter · set ovenfra',
  },
]
