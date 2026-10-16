export type Action =
  | 'moveLeft'
  | 'moveRight'
  | 'moveUp'
  | 'moveDown'
  | 'jump'
  | 'brake'
  | 'interact'

export type Camera = 'side' | 'top'

export type LevelId = 1 | 2 | 3 | 4
export type GameId = 'hen' | 'car'
export type DeviceChoice = 'computer' | 'controller' | 'tablet'
export type PadBrand = 'playstation' | 'xbox'

export type Hint = 'arrows-x' | 'space' | 'arrows-y' | 'enter'

export type KeyCap = 'left' | 'right' | 'up' | 'down' | 'space' | 'enter'

export interface LevelConfig {
  id: LevelId
  name: string
  camera: Camera
  actions: Action[]
  hintActions: Action[]
  hint: Hint
  hintLabel: string
  note: string
}

export interface Prop {
  kind: 'egg' | 'bush' | 'cone' | 'puddle'
  x: number
  y: number
  r: number
}

export type EggLife = 'egg' | 'crack' | 'chick'
export type PuddleLife = 'puddle' | 'splash'
export type PropLife = EggLife | PuddleLife

export interface LiveProp extends Prop {
  react: number
  touching: boolean
  life: PropLife
  age: number
}

export interface Chicken {
  x: number
  y: number
  vx: number
  vy: number
  facing: 1 | -1
  turn: number
  steer: number
  aim: number
  onGround: boolean
  moving: boolean
  squash: number
  walk: number
  peck: number
  ripple: number
  braking: boolean
}
