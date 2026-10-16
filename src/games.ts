import { CAR_LEVELS, LEVELS } from './levels'
import type { GameId, LevelConfig } from './types'

export interface GameSounds {
  peck: string
  peep?: string
}

export interface MiniGame {
  id: GameId
  name: string
  levels: LevelConfig[]
  sounds: GameSounds
}

export const GAMES: MiniGame[] = [
  {
    id: 'hen',
    name: 'Hønen',
    levels: LEVELS,
    sounds: {
      peck: 'sounds/hen/cluck.wav',
      peep: 'sounds/hen/peep.wav',
    },
  },
  {
    id: 'car',
    name: 'Bilen',
    levels: CAR_LEVELS,
    sounds: {
      peck: 'sounds/car/horn.wav',
    },
  },
]

export function gameById(id: GameId | null): MiniGame {
  return GAMES.find((game) => game.id === id) ?? GAMES[0]
}
