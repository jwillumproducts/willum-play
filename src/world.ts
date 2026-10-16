import type { Camera, GameId, Prop } from './types'

export const VIEW_W = 1280
export const VIEW_H = 720
export const GROUND_Y = 568

const SIDE_PROPS: Prop[] = [
  { kind: 'bush', x: 340, y: 524, r: 36 },
  { kind: 'egg', x: 520, y: 536, r: 24 },
  { kind: 'egg', x: 760, y: 536, r: 24 },
  { kind: 'bush', x: 940, y: 520, r: 40 },
  { kind: 'egg', x: 1120, y: 536, r: 24 },
]

const TOP_PROPS: Prop[] = [
  { kind: 'egg', x: 280, y: 230, r: 24 },
  { kind: 'bush', x: 250, y: 460, r: 36 },
  { kind: 'bush', x: 470, y: 250, r: 34 },
  { kind: 'egg', x: 860, y: 210, r: 24 },
  { kind: 'bush', x: 1060, y: 340, r: 40 },
  { kind: 'egg', x: 980, y: 540, r: 24 },
  { kind: 'egg', x: 620, y: 540, r: 24 },
  { kind: 'bush', x: 400, y: 560, r: 32 },
]

const CAR_SIDE_PROPS: Prop[] = [
  { kind: 'puddle', x: 340, y: 536, r: 32 },
  { kind: 'cone', x: 460, y: 530, r: 22 },
  { kind: 'puddle', x: 640, y: 536, r: 32 },
  { kind: 'cone', x: 780, y: 530, r: 22 },
  { kind: 'puddle', x: 920, y: 536, r: 32 },
  { kind: 'cone', x: 1080, y: 530, r: 22 },
]

const CAR_TOP_PROPS: Prop[] = [
  { kind: 'puddle', x: 300, y: 250, r: 32 },
  { kind: 'cone', x: 520, y: 420, r: 22 },
  { kind: 'puddle', x: 840, y: 220, r: 32 },
  { kind: 'cone', x: 400, y: 520, r: 22 },
  { kind: 'puddle', x: 980, y: 500, r: 32 },
  { kind: 'puddle', x: 620, y: 340, r: 32 },
  { kind: 'cone', x: 1080, y: 340, r: 22 },
]

export function sceneryFor(camera: Camera, game: GameId = 'hen'): Prop[] {
  if (game === 'car') return camera === 'side' ? CAR_SIDE_PROPS : CAR_TOP_PROPS
  return camera === 'side' ? SIDE_PROPS : TOP_PROPS
}
