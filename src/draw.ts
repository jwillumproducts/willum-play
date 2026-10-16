import type { Chicken, GameId, LevelConfig, LiveProp } from './types'
import { GROUND_Y, VIEW_H, VIEW_W } from './world'

interface Frame {
  game: GameId
  level: LevelConfig
  time: number
  chicken: Chicken
  props: LiveProp[]
}

export function render(ctx: CanvasRenderingContext2D, frame: Frame): void {
  const car = frame.game === 'car'
  if (frame.level.camera === 'side') {
    if (car) drawRoadSide(ctx)
    else drawSideScene(ctx, frame.time)
  } else if (car) drawRoadTop(ctx)
  else drawTopScene(ctx, frame.time)

  for (const prop of frame.props) {
    if (prop.kind === 'puddle') drawPuddle(ctx, prop, frame.level.camera, frame.time, false)
    else if (prop.kind === 'egg') drawEgg(ctx, prop, frame.level.camera, frame.time)
    else if (prop.kind === 'cone') drawCone(ctx, prop, frame.level.camera)
    else drawBush(ctx, prop)
  }

  if (car) drawCar(ctx, frame)
  else drawChicken(ctx, frame)

  for (const prop of frame.props) {
    if (prop.kind === 'puddle') drawPuddle(ctx, prop, frame.level.camera, frame.time, true)
  }
}

function drawSideScene(ctx: CanvasRenderingContext2D, time: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, '#f8e8c8')
  sky.addColorStop(1, '#f4c9a4')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  ctx.fillStyle = '#ffe08a'
  ctx.beginPath()
  ctx.arc(1080, 118, 56, 0, Math.PI * 2)
  ctx.fill()

  cloud(ctx, 220 + Math.sin(time * 0.15) * 16, 130, 1)
  cloud(ctx, 620 + Math.sin(time * 0.1) * 12, 90, 0.8)

  ctx.fillStyle = '#d5e2ae'
  ctx.beginPath()
  ctx.ellipse(260, GROUND_Y + 10, 300, 100, 0, Math.PI, 0)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(980, GROUND_Y + 20, 360, 120, 0, Math.PI, 0)
  ctx.fill()

  ctx.fillStyle = '#8fbf73'
  ctx.fillRect(0, GROUND_Y - 8, VIEW_W, VIEW_H)
  ctx.fillStyle = '#74a864'
  ctx.fillRect(0, GROUND_Y - 8, VIEW_W, 26)

  ctx.fillStyle = '#6a9e5c'
  for (let i = 0; i < 18; i += 1) {
    const x = 36 + i * 72
    const h = 18 + (i % 3) * 7
    ctx.beginPath()
    ctx.ellipse(x, GROUND_Y - 8, 10, h, 0, Math.PI, 0)
    ctx.fill()
  }

  post(ctx, 28)
  post(ctx, VIEW_W - 50)
}

function drawTopScene(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = '#8fbf73'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  ctx.fillStyle = '#7eb368'
  const spots: Array<[number, number, number]> = [
    [180, 160, 90],
    [520, 140, 70],
    [900, 180, 110],
    [200, 560, 80],
    [700, 600, 100],
    [1100, 520, 70],
  ]
  for (const [x, y, r] of spots) {
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.62, time * 0.01, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = '#c4874e'
  ctx.lineWidth = 12
  ctx.strokeRect(78, 78, VIEW_W - 156, VIEW_H - 156)
  ctx.fillStyle = '#a86b3c'
  for (let i = 0; i < 8; i += 1) {
    const x = 78 + i * ((VIEW_W - 156) / 7)
    peg(ctx, x, 78)
    peg(ctx, x, VIEW_H - 78)
  }
  for (let i = 1; i < 5; i += 1) {
    const y = 78 + i * ((VIEW_H - 156) / 5)
    peg(ctx, 78, y)
    peg(ctx, VIEW_W - 78, y)
  }
}

function post(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.fillStyle = '#c4874e'
  ctx.fillRect(x, GROUND_Y - 110, 22, 118)
  ctx.fillStyle = '#a86b3c'
  ctx.beginPath()
  ctx.arc(x + 11, GROUND_Y - 110, 14, 0, Math.PI * 2)
  ctx.fill()
}

function peg(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  ctx.fill()
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.fillStyle = 'rgba(255, 250, 243, 0.9)'
  ctx.beginPath()
  ctx.ellipse(x, y, 54 * scale, 28 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 40 * scale, y + 8, 36 * scale, 22 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(x - 36 * scale, y + 10, 30 * scale, 18 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawEgg(ctx: CanvasRenderingContext2D, prop: LiveProp, camera: 'side' | 'top', time: number): void {
  if (prop.life === 'egg') {
    drawWholeEgg(ctx, prop.x, prop.y, prop.r, 1)
    return
  }
  if (prop.life === 'crack') {
    const open = Math.min(1, prop.age / 0.42)
    drawHatchling(ctx, prop, camera, time, open * 0.7)
    drawShell(ctx, prop.x, prop.y, prop.r, -1, open)
    drawShell(ctx, prop.x, prop.y, prop.r, 1, open)
    return
  }
  const fade = prop.age > 2.6 ? Math.min(1, (prop.age - 2.6) / 0.5) : 0
  ctx.save()
  ctx.globalAlpha = 1 - fade
  drawHatchling(ctx, prop, camera, time, 1)
  ctx.restore()
  if (fade > 0) drawWholeEgg(ctx, prop.x, prop.y, prop.r, fade)
}

function drawWholeEgg(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, scale: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  shadow(ctx, 0, r * 0.85, r * 0.7, r * 0.22)
  ctx.fillStyle = '#fffaf3'
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.75, r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.beginPath()
  ctx.ellipse(-6, -8, r * 0.16, r * 0.28, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawShell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  side: -1 | 1,
  open: number,
): void {
  ctx.save()
  ctx.translate(x + side * open * r * 0.7, y + open * r * 0.15)
  ctx.rotate(side * open * 0.55)
  ctx.fillStyle = '#fffaf3'
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.75, r, 0, side === -1 ? Math.PI / 2 : -Math.PI / 2, side === -1 ? Math.PI * 1.5 : Math.PI / 2)
  ctx.fill()
  ctx.restore()
}

function drawHatchling(
  ctx: CanvasRenderingContext2D,
  prop: LiveProp,
  camera: 'side' | 'top',
  time: number,
  grow: number,
): void {
  const bob = camera === 'side' ? Math.max(0, Math.sin(time * 7)) * 3 * grow : Math.sin(time * 7) * 2 * grow
  ctx.save()
  const foot = camera === 'side' ? GROUND_Y - 2 : prop.y
  ctx.translate(prop.x, foot - bob)
  ctx.scale(grow, grow)
  if (camera === 'side') drawHatchlingSide(ctx)
  else drawHatchlingTop(ctx)
  ctx.restore()
}

function drawHatchlingSide(ctx: CanvasRenderingContext2D): void {
  shadow(ctx, 0, 4, 14, 4)
  ctx.strokeStyle = '#e09a4a'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-5, -8)
  ctx.lineTo(-6, 2)
  ctx.moveTo(5, -8)
  ctx.lineTo(6, 2)
  ctx.stroke()
  ctx.fillStyle = '#ffd15c'
  ctx.beginPath()
  ctx.ellipse(0, -16, 13, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(9, -26, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e07a5f'
  ctx.beginPath()
  ctx.arc(7, -32, 2.4, 0, Math.PI * 2)
  ctx.arc(11, -33, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f4a261'
  ctx.beginPath()
  ctx.moveTo(14, -27)
  ctx.lineTo(21, -24)
  ctx.lineTo(14, -22)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#5c3b32'
  ctx.beginPath()
  ctx.arc(11, -27, 1.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawHatchlingTop(ctx: CanvasRenderingContext2D): void {
  shadow(ctx, 2, 3, 16, 10)
  ctx.fillStyle = '#e09a4a'
  ctx.beginPath()
  ctx.ellipse(-1, -8, 3.5, 2.2, 0, 0, Math.PI * 2)
  ctx.ellipse(-1, 8, 3.5, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffd15c'
  ctx.beginPath()
  ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(12, 0, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e07a5f'
  ctx.beginPath()
  ctx.arc(10, -4, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f4a261'
  ctx.beginPath()
  ctx.moveTo(17, -2)
  ctx.lineTo(23, 0)
  ctx.lineTo(17, 2)
  ctx.closePath()
  ctx.fill()
}

function drawBush(ctx: CanvasRenderingContext2D, prop: LiveProp): void {
  const wobble = Math.sin(prop.react * Math.PI) * 7
  ctx.save()
  ctx.translate(prop.x + wobble, prop.y)
  shadow(ctx, 0, prop.r * 0.7, prop.r, prop.r * 0.28)
  ctx.fillStyle = '#5f9a58'
  ctx.beginPath()
  ctx.arc(-prop.r * 0.45, 6, prop.r * 0.62, 0, Math.PI * 2)
  ctx.arc(prop.r * 0.42, 8, prop.r * 0.55, 0, Math.PI * 2)
  ctx.arc(0, -prop.r * 0.25, prop.r * 0.72, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#86c078'
  ctx.beginPath()
  ctx.arc(-4, -prop.r * 0.45, prop.r * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(92, 59, 50, 0.13)'
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawChicken(ctx: CanvasRenderingContext2D, frame: Frame): void {
  const chicken = frame.chicken
  if (frame.level.camera === 'side') drawChickenSide(ctx, chicken, frame.time)
  else drawChickenTop(ctx, chicken, frame.time)

  if (chicken.ripple <= 0) return
  const y = frame.level.camera === 'side' ? chicken.y - 70 : chicken.y
  ctx.strokeStyle = `rgba(255, 248, 236, ${chicken.ripple * 0.85})`
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(chicken.x, y, 46 + (1 - chicken.ripple) * 64, 0, Math.PI * 2)
  ctx.stroke()
}

function drawChickenSide(ctx: CanvasRenderingContext2D, chicken: Chicken, time: number): void {
  const lift = Math.max(0, GROUND_Y - chicken.y)
  const shadowScale = Math.max(0.45, 1 - lift / 280)
  shadow(ctx, chicken.x, GROUND_Y + 6, 40 * shadowScale, 12 * shadowScale)

  ctx.save()
  ctx.translate(chicken.x, chicken.y)
  ctx.scale(chicken.facing, 1)
  ctx.scale(1 + chicken.squash, 1 - chicken.squash)

  const bob = chicken.moving ? Math.abs(Math.sin(chicken.walk)) * -4 : Math.sin(time * 1.6) * -2
  const stride = chicken.moving ? Math.sin(chicken.walk) : 0
  const tuck = chicken.onGround ? 0 : 10

  ctx.strokeStyle = '#e0a15a'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  leg(ctx, -14, bob, stride * 16, tuck)
  leg(ctx, 10, bob, stride * -16, tuck)

  ctx.fillStyle = '#3a342f'
  ctx.beginPath()
  ctx.ellipse(-52, -86 + bob, 16, 22, -0.7, 0, Math.PI * 2)
  ctx.ellipse(-40, -68 + bob, 20, 14, -0.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff8ef'
  ctx.beginPath()
  ctx.ellipse(0, -78 + bob, 58, 44, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f3ece2'
  ctx.beginPath()
  ctx.ellipse(8, -68 + bob, 22, 16, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3a342f'
  ctx.beginPath()
  ctx.ellipse(20, -60 + bob, 9, 6, 0.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff8ef'
  ctx.beginPath()
  ctx.arc(34, -118 + bob, 32, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#e07a5f'
  ctx.beginPath()
  ctx.arc(24, -146 + bob, 10, 0, Math.PI * 2)
  ctx.arc(38, -152 + bob, 9, 0, Math.PI * 2)
  ctx.arc(50, -142 + bob, 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f4a261'
  ctx.beginPath()
  ctx.moveTo(58, -122 + bob)
  ctx.lineTo(92, -110 + bob)
  ctx.lineTo(58, -100 + bob)
  ctx.closePath()
  ctx.fill()

  eye(ctx, 46, -124 + bob, blink(time))
  ctx.restore()
}

function drawChickenTop(ctx: CanvasRenderingContext2D, chicken: Chicken, time: number): void {
  shadow(ctx, chicken.x + 4, chicken.y + 8, 52, 36)

  const lunge = chicken.peck >= 0 ? Math.sin(chicken.peck * Math.PI) * 18 : 0
  const step = chicken.moving ? Math.sin(chicken.walk) * 4 : 0
  ctx.save()
  ctx.translate(chicken.x, chicken.y)
  ctx.rotate(chicken.aim)
  ctx.scale(1.35, 1.35)
  ctx.scale(1 + chicken.squash, 1 - chicken.squash * 0.4)

  overheadFoot(ctx, -4, -24, step)
  overheadFoot(ctx, -4, 24, -step)

  ctx.fillStyle = '#f3ece2'
  ctx.beginPath()
  ctx.ellipse(-2, -30, 18, 11, -0.3, 0, Math.PI * 2)
  ctx.ellipse(-2, 30, 18, 11, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3a342f'
  ctx.beginPath()
  ctx.ellipse(-6, -36, 8, 5, -0.2, 0, Math.PI * 2)
  ctx.ellipse(-6, 36, 8, 5, 0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#3a342f'
  ctx.beginPath()
  ctx.ellipse(-32, 0, 16, 13, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff8ef'
  ctx.beginPath()
  ctx.ellipse(0, 0, 34, 28, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff8ef'
  ctx.beginPath()
  ctx.arc(30 + lunge, 0, 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#e07a5f'
  ctx.beginPath()
  ctx.arc(24 + lunge, -8, 6, 0, Math.PI * 2)
  ctx.arc(32 + lunge, -10, 5, 0, Math.PI * 2)
  ctx.arc(18 + lunge, -4, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f4a261'
  ctx.beginPath()
  ctx.moveTo(44 + lunge, -5)
  ctx.lineTo(62 + lunge, 0)
  ctx.lineTo(44 + lunge, 5)
  ctx.closePath()
  ctx.fill()

  eye(ctx, 34 + lunge, 5, blink(time))

  if (lunge > 4) {
    ctx.strokeStyle = 'rgba(255, 248, 230, 0.9)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(70 + lunge, 0, 8 + lunge * 0.25, -0.9, 0.9)
    ctx.stroke()
  }

  ctx.restore()
}

function overheadFoot(ctx: CanvasRenderingContext2D, x: number, y: number, step: number): void {
  ctx.fillStyle = '#e09a4a'
  ctx.beginPath()
  ctx.ellipse(x + step, y, 8, 5, 0, 0, Math.PI * 2)
  ctx.fill()
}

function leg(ctx: CanvasRenderingContext2D, x: number, bob: number, swing: number, tuck: number): void {
  ctx.beginPath()
  ctx.moveTo(x, -34 + bob)
  ctx.lineTo(x + swing, -tuck)
  ctx.stroke()
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, closed: boolean): void {
  ctx.fillStyle = '#5c3b32'
  if (closed) {
    ctx.fillRect(x - 7, y, 14, 3)
    return
  }
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fffaf3'
  ctx.beginPath()
  ctx.arc(x + 2, y - 2, 1.8, 0, Math.PI * 2)
  ctx.fill()
}

function blink(time: number): boolean {
  return time % 3.4 < 0.12
}

function drawRoadSide(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, '#d7ecf8')
  sky.addColorStop(1, '#f8e8c8')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  ctx.fillStyle = '#ffe08a'
  ctx.beginPath()
  ctx.arc(1080, 118, 56, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#c9d8b0'
  ctx.beginPath()
  ctx.ellipse(280, GROUND_Y + 8, 320, 90, 0, Math.PI, 0)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(980, GROUND_Y + 16, 360, 110, 0, Math.PI, 0)
  ctx.fill()

  ctx.fillStyle = '#8fbf73'
  ctx.fillRect(0, GROUND_Y + 28, VIEW_W, VIEW_H)
  ctx.fillStyle = '#6d6a67'
  ctx.fillRect(0, GROUND_Y - 10, VIEW_W, 48)
  ctx.fillStyle = '#fffaf3'
  ctx.fillRect(0, GROUND_Y - 10, VIEW_W, 6)
  ctx.fillRect(0, GROUND_Y + 28, VIEW_W, 5)
}

function drawRoadTop(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8fbf73'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  ctx.fillStyle = '#74a864'
  ctx.fillRect(0, 0, VIEW_W, 70)
  ctx.fillRect(0, VIEW_H - 70, VIEW_W, 70)

  ctx.fillStyle = '#6d6a67'
  ctx.beginPath()
  ctx.roundRect(90, 110, VIEW_W - 180, VIEW_H - 200, 36)
  ctx.fill()

  ctx.strokeStyle = '#fffaf3'
  ctx.lineWidth = 8
  ctx.setLineDash([28, 22])
  ctx.beginPath()
  ctx.moveTo(160, VIEW_H / 2)
  ctx.lineTo(VIEW_W - 160, VIEW_H / 2)
  ctx.moveTo(VIEW_W / 2, 160)
  ctx.lineTo(VIEW_W / 2, VIEW_H - 160)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawPuddle(
  ctx: CanvasRenderingContext2D,
  prop: LiveProp,
  camera: 'side' | 'top',
  time: number,
  spray: boolean,
): void {
  if (spray) {
    if (prop.life === 'splash') drawPuddleSpray(ctx, prop, camera)
    return
  }
  drawPuddleWater(ctx, prop, camera, time)
}

function drawPuddleWater(
  ctx: CanvasRenderingContext2D,
  prop: LiveProp,
  camera: 'side' | 'top',
  time: number,
): void {
  const splash = prop.life === 'splash'
  const t = splash ? Math.min(1, prop.age / 0.8) : 0
  const appear = splash ? 1 : Math.min(1, 0.55 + prop.age * 3)
  const flatten = splash ? 1 + t * 0.55 : 1
  const fade = splash ? 1 - t * 0.85 : 1
  const rx = prop.r * (camera === 'side' ? 1.45 : 1.2) * flatten * appear
  const ry = prop.r * (camera === 'side' ? 0.34 : 0.72) * (splash ? 1 - t * 0.35 : 1) * appear
  const x = prop.x
  const y = camera === 'side' ? GROUND_Y + 10 : prop.y
  ctx.save()
  ctx.globalAlpha = fade
  ctx.fillStyle = '#4f97b8'
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#8fc4dc'
  ctx.beginPath()
  ctx.ellipse(x - rx * 0.18, y - ry * 0.12, rx * 0.42, ry * 0.38, -0.2, 0, Math.PI * 2)
  ctx.fill()
  if (!splash) {
    const glint = 0.55 + Math.sin(time * 3 + prop.x * 0.02) * 0.2
    ctx.fillStyle = `rgba(255, 250, 243, ${glint})`
    ctx.beginPath()
    ctx.ellipse(x - rx * 0.28, y - ry * 0.2, rx * 0.16, ry * 0.18, -0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawPuddleSpray(ctx: CanvasRenderingContext2D, prop: LiveProp, camera: 'side' | 'top'): void {
  const t = Math.min(1, prop.age / 0.8)
  const lift = Math.sin(t * Math.PI)
  const x = prop.x
  const y = camera === 'side' ? GROUND_Y + 6 : prop.y
  ctx.save()
  ctx.globalAlpha = 1 - t * 0.35
  if (camera === 'top') {
    ctx.strokeStyle = `rgba(143, 196, 220, ${0.7 * (1 - t)})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(x, y, prop.r * (1.1 + t * 1.8), prop.r * (0.7 + t * 1.2), 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2
    const dir = (i - 3.5) / 3.5
    const dropX = camera === 'side' ? x + dir * (14 + t * 42) : x + Math.cos(angle) * (12 + t * 38)
    const dropY =
      camera === 'side'
        ? y - lift * (62 + (i % 3) * 18) - t * 10
        : y + Math.sin(angle) * (14 + t * 32)
    const size = 7.5 - t * 3 + (i % 2)
    ctx.fillStyle = i % 2 === 0 ? '#8fc4dc' : '#c5e7f6'
    ctx.beginPath()
    ctx.ellipse(dropX, dropY, size, camera === 'side' ? size * 1.25 : size * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawCone(ctx: CanvasRenderingContext2D, prop: LiveProp, camera: 'side' | 'top'): void {
  const wobble = Math.sin(prop.react * Math.PI) * 8
  ctx.save()
  if (camera === 'side') {
    ctx.translate(prop.x, GROUND_Y)
    ctx.rotate(wobble * 0.015)
    ctx.fillStyle = '#f4a261'
    ctx.beginPath()
    ctx.moveTo(0, -50)
    ctx.lineTo(18, 0)
    ctx.lineTo(-18, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fffaf3'
    ctx.fillRect(-12, -24, 24, 8)
  } else {
    ctx.translate(prop.x + wobble, prop.y)
    shadow(ctx, 2, 4, 16, 8)
    ctx.fillStyle = '#f4a261'
    ctx.beginPath()
    ctx.arc(0, 0, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fffaf3'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawCar(ctx: CanvasRenderingContext2D, frame: Frame): void {
  const chicken = frame.chicken
  if (frame.level.camera === 'side') drawCarSide(ctx, chicken)
  else drawCarTop(ctx, chicken)

  if (chicken.peck < 0) return
  const open = Math.sin(chicken.peck * Math.PI)
  const side = frame.level.camera === 'side'
  const nose = chicken.turn < 0 ? -1 : 1
  const x = chicken.x + (side ? nose * 80 : Math.cos(chicken.aim) * 58)
  const y = side ? chicken.y - 44 : chicken.y + Math.sin(chicken.aim) * 64
  ctx.save()
  ctx.translate(x, y)
  if (!side) ctx.rotate(chicken.aim)
  else if (nose < 0) ctx.rotate(Math.PI)
  ctx.strokeStyle = `rgba(255, 236, 160, ${0.9 * open})`
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(0, 0, 14 + open * 26, -0.9, 0.9)
  ctx.stroke()
  ctx.restore()
}

function drawCarSide(ctx: CanvasRenderingContext2D, chicken: Chicken): void {
  const lift = Math.max(0, GROUND_Y - chicken.y)
  const shadowScale = Math.max(0.45, 1 - lift / 280)
  shadow(ctx, chicken.x, GROUND_Y + 8, 78 * shadowScale, 12 * shadowScale)

  ctx.save()
  ctx.translate(chicken.x, chicken.y)
  const face = chicken.turn
  ctx.scale((face < 0 ? -1 : 1) * Math.max(0.22, Math.abs(face)), 1)

  wheel(ctx, -36, -22, chicken.walk, 22)
  wheel(ctx, 44, -22, chicken.walk, 22)

  ctx.fillStyle = '#e24b3c'
  ctx.beginPath()
  ctx.roundRect(-76, -56, 156, 38, 16)
  ctx.fill()
  fender(ctx, -36, -22, 26)
  fender(ctx, 44, -22, 26)

  ctx.fillStyle = '#e24b3c'
  ctx.beginPath()
  ctx.moveTo(-54, -56)
  ctx.lineTo(-54, -88)
  ctx.quadraticCurveTo(-54, -108, -32, -108)
  ctx.lineTo(26, -108)
  ctx.quadraticCurveTo(50, -108, 58, -74)
  ctx.lineTo(64, -56)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#ee6b5c'
  ctx.beginPath()
  ctx.ellipse(6, -44, 34, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#c5e7f6'
  ctx.beginPath()
  ctx.moveTo(-42, -62)
  ctx.lineTo(-42, -86)
  ctx.quadraticCurveTo(-42, -96, -24, -96)
  ctx.lineTo(22, -96)
  ctx.quadraticCurveTo(42, -96, 48, -72)
  ctx.lineTo(50, -62)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e8f6fc'
  ctx.beginPath()
  ctx.ellipse(-2, -82, 9, 10, -0.25, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#efeae4'
  ctx.beginPath()
  ctx.roundRect(-80, -36, 14, 18, 6)
  ctx.roundRect(74, -36, 16, 18, 6)
  ctx.fill()

  ctx.fillStyle = '#efeae4'
  ctx.beginPath()
  ctx.arc(68, -46, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = chicken.peck >= 0 ? '#fff6c2' : '#ffe08a'
  ctx.beginPath()
  ctx.arc(68, -46, 7, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = chicken.braking ? '#ff4d3a' : '#8e342c'
  ctx.beginPath()
  ctx.roundRect(-72, -52, 12, 10, 3)
  ctx.fill()
  ctx.restore()
}

function drawCarTop(ctx: CanvasRenderingContext2D, chicken: Chicken): void {
  shadow(ctx, chicken.x + 4, chicken.y + 8, 58, 32)

  ctx.save()
  ctx.translate(chicken.x, chicken.y)
  ctx.rotate(chicken.aim)
  ctx.scale(1 + chicken.squash * 0.25, 1 - chicken.squash * 0.1)

  roadWheel(ctx, -28, -32, 0)
  roadWheel(ctx, -28, 32, 0)
  roadWheel(ctx, 34, -32, chicken.steer)
  roadWheel(ctx, 34, 32, chicken.steer)

  ctx.fillStyle = '#e24b3c'
  ctx.beginPath()
  ctx.roundRect(-56, -26, 114, 52, 22)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-28, -24, 18, 10, 0, 0, Math.PI * 2)
  ctx.ellipse(-28, 24, 18, 10, 0, 0, Math.PI * 2)
  ctx.ellipse(34, -24, 18, 10, 0, 0, Math.PI * 2)
  ctx.ellipse(34, 24, 18, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ee6b5c'
  ctx.beginPath()
  ctx.ellipse(0, 0, 28, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#c5e7f6'
  ctx.beginPath()
  ctx.roundRect(10, -15, 22, 30, 8)
  ctx.roundRect(-34, -13, 18, 26, 7)
  ctx.roundRect(-12, -21, 26, 7, 3)
  ctx.roundRect(-12, 14, 26, 7, 3)
  ctx.fill()
  ctx.fillStyle = '#e8f6fc'
  ctx.beginPath()
  ctx.ellipse(16, -6, 6, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#efeae4'
  ctx.beginPath()
  ctx.roundRect(-62, -16, 10, 32, 5)
  ctx.roundRect(52, -16, 12, 32, 6)
  ctx.fill()

  ctx.fillStyle = '#efeae4'
  ctx.beginPath()
  ctx.arc(48, -12, 7, 0, Math.PI * 2)
  ctx.arc(48, 12, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = chicken.peck >= 0 ? '#fff6c2' : '#ffe08a'
  ctx.beginPath()
  ctx.arc(48, -12, 4.5, 0, Math.PI * 2)
  ctx.arc(48, 12, 4.5, 0, Math.PI * 2)
  ctx.fill()

  tailLamp(ctx, -54, -12, chicken.braking)
  tailLamp(ctx, -54, 12, chicken.braking)
  ctx.restore()
}

function roadWheel(ctx: CanvasRenderingContext2D, x: number, y: number, steer: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(steer)
  ctx.fillStyle = '#2c2a28'
  ctx.beginPath()
  ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#d9d4ce'
  ctx.beginPath()
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#efeae4'
  ctx.beginPath()
  ctx.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function fender(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 22): void {
  ctx.fillStyle = '#e24b3c'
  ctx.beginPath()
  ctx.arc(x, y, radius, Math.PI, 0, false)
  ctx.fill()
}

function tailLamp(ctx: CanvasRenderingContext2D, x: number, y: number, braking: boolean): void {
  ctx.fillStyle = braking ? '#ff4d3a' : '#8e342c'
  ctx.beginPath()
  ctx.roundRect(x - 5, y - 4, 10, 8, 2)
  ctx.fill()
}

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number, radius = 18): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(spin)
  ctx.fillStyle = '#2c2a28'
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#d9d4ce'
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#efeae4'
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const MARK_HEN: Chicken = {
  x: 110,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  facing: 1,
  turn: 1,
  steer: 0,
  aim: 0,
  onGround: true,
  moving: false,
  squash: 0,
  walk: 0.8,
  peck: -1,
  ripple: 0,
  braking: false,
}

export function drawHenMark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  paintMark(ctx, width, height, 240, 200, 0, GROUND_Y - 168, (source) => {
    drawChickenSide(source, MARK_HEN, 0.5)
  })
}

const MARK_CAR: Chicken = {
  ...MARK_HEN,
  x: 120,
  walk: 0.4,
}

export function drawCarMark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  paintMark(ctx, width, height, 240, 168, 0, GROUND_Y - 140, (source) => {
    drawCarSide(source, MARK_CAR)
  })
}

function paintMark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cropW: number,
  cropH: number,
  cropX: number,
  cropY: number,
  paint: (source: CanvasRenderingContext2D) => void,
): void {
  const off = document.createElement('canvas')
  off.width = cropW
  off.height = cropH
  const source = off.getContext('2d')
  if (!source) return
  source.setTransform(1, 0, 0, 1, -cropX, -cropY)
  paint(source)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(off, 0, 0, cropW, cropH, 0, 0, width, height)
}
