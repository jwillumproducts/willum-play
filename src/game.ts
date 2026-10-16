import type { Sound } from './audio'
import { InputManager } from './input'
import type { Action, Chicken, GameId, KeyCap, LevelConfig, LiveProp } from './types'
import { GROUND_Y, sceneryFor, VIEW_H, VIEW_W } from './world'
import { render } from './draw'

const MOVE_SPEED = 280
const JUMP_V = -700
const GRAVITY = 1800
const BODY_LIFT = 70
const HIT_R = 50

export class Game {
  private readonly ctx: CanvasRenderingContext2D
  private readonly input: InputManager
  private readonly props: LiveProp[]
  private readonly chicken: Chicken
  private raf = 0
  private last = 0
  private time = 0
  private stepTimer = 0.2
  private running = false
  private paused = false
  private nudgeX = 0
  private nudgeY = 0
  private nudgeTime = 0
  private brakeTime = 0

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly level: LevelConfig,
    private readonly gameId: GameId,
    private readonly sound: Sound,
    private readonly onKeys: (caps: KeyCap[]) => void,
    usePad = false,
    onMenu: () => void = () => {},
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas er ikke tilgængelig')
    this.ctx = ctx
    this.input = new InputManager(level.actions, usePad, onMenu)
    this.props = sceneryFor(level.camera, gameId).map((prop) => ({
      ...prop,
      react: 0,
      touching: false,
      life: prop.kind === 'puddle' ? 'puddle' : 'egg',
      age: 0,
    }))
    const side = level.camera === 'side'
    this.chicken = {
      x: side ? 170 : 640,
      y: side ? GROUND_Y : 360,
      vx: 0,
      vy: 0,
      facing: 1,
      turn: 1,
      steer: 0,
      aim: !side && gameId === 'car' ? -Math.PI / 2 : 0,
      onGround: true,
      moving: false,
      squash: 0,
      walk: 0,
      peck: -1,
      ripple: 0,
      braking: false,
    }
    this.onResize = this.onResize.bind(this)
  }

  start(): void {
    this.fit()
    window.addEventListener('resize', this.onResize)
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    this.input.dispose()
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    this.input.setPaused(paused)
    if (!paused) this.last = performance.now()
  }

  holdPointer(pointerId: number, action: Action): void {
    this.input.holdPointer(pointerId, action)
  }

  releasePointer(pointerId: number): void {
    this.input.releasePointer(pointerId)
  }

  private onResize(): void {
    this.fit()
  }

  private fit(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = VIEW_W * dpr
    this.canvas.height = VIEW_H * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private frame = (now: number): void => {
    if (!this.running) return
    const dt = Math.min(0.033, (now - this.last) / 1000)
    this.last = now
    this.input.poll()
    if (!this.paused) this.update(dt)
    this.onKeys(this.input.activeCaps())
    render(this.ctx, {
      game: this.gameId,
      level: this.level,
      time: this.time,
      chicken: this.chicken,
      props: this.props,
    })
    this.raf = requestAnimationFrame(this.frame)
  }

  private update(dt: number): void {
    const edges = this.input.drainEdges()
    this.noteTaps(edges)
    const hinted = edges.some((action) => this.level.hintActions.includes(action))
    if (hinted) this.chicken.ripple = 1

    if (this.level.camera === 'side') this.updateSide(dt, edges)
    else this.updateTop(dt, edges)
    this.easeCar(dt)

    this.touchProps(dt)
    this.chicken.squash += (0 - this.chicken.squash) * Math.min(1, dt * 7)
    if (this.chicken.ripple > 0) this.chicken.ripple = Math.max(0, this.chicken.ripple - dt * 1.3)
    if (this.chicken.peck >= 0) {
      this.chicken.peck += dt / 0.38
      if (this.chicken.peck >= 1) this.chicken.peck = -1
    }
    this.nudgeTime = Math.max(0, this.nudgeTime - dt)
    this.brakeTime = Math.max(0, this.brakeTime - dt)
    this.time += dt
  }

  private noteTaps(edges: Action[]): void {
    const left = edges.includes('moveLeft')
    const right = edges.includes('moveRight')
    const up = edges.includes('moveUp')
    const down = edges.includes('moveDown')
    if (!left && !right && !up && !down) return
    this.nudgeX = (right ? 1 : 0) - (left ? 1 : 0)
    this.nudgeY = (down ? 1 : 0) - (up ? 1 : 0)
    this.nudgeTime = 0.18
  }

  private axis(negative: Action, positive: Action, nudge: number): number {
    const held = (this.input.isHeld(positive) ? 1 : 0) - (this.input.isHeld(negative) ? 1 : 0)
    if (held !== 0) return held
    if (this.nudgeTime > 0) return nudge
    return 0
  }

  private updateSide(dt: number, edges: Action[]): void {
    const chicken = this.chicken
    const braking = this.applyBrake(edges)
    const dir = braking ? 0 : this.axis('moveLeft', 'moveRight', this.nudgeX)
    chicken.vx = dir * MOVE_SPEED
    chicken.vy += GRAVITY * dt
    if (dir !== 0) chicken.facing = dir > 0 ? 1 : -1

    if (edges.includes('jump') && chicken.onGround) {
      chicken.vy = JUMP_V
      chicken.onGround = false
      chicken.squash = -0.22
      this.sound.jump()
    }

    chicken.x += chicken.vx * dt
    chicken.y += chicken.vy * dt

    const minX = 96
    const maxX = VIEW_W - 96
    if (chicken.x < minX || chicken.x > maxX) chicken.squash = Math.max(chicken.squash, 0.12)
    chicken.x = Math.min(maxX, Math.max(minX, chicken.x))

    if (chicken.y >= GROUND_Y) {
      if (!chicken.onGround) {
        chicken.squash = 0.26
        this.sound.land()
      }
      chicken.y = GROUND_Y
      chicken.vy = 0
      chicken.onGround = true
    }

    this.step(dt, chicken.onGround && dir !== 0)
  }

  private updateTop(dt: number, edges: Action[]): void {
    const chicken = this.chicken
    const braking = this.applyBrake(edges)
    const moving = this.slideTop(dt, braking)

    const minX = 130
    const maxX = VIEW_W - 130
    const minY = 130
    const maxY = VIEW_H - 130
    if (chicken.x < minX || chicken.x > maxX || chicken.y < minY || chicken.y > maxY) {
      chicken.squash = Math.max(chicken.squash, 0.1)
    }
    chicken.x = Math.min(maxX, Math.max(minX, chicken.x))
    chicken.y = Math.min(maxY, Math.max(minY, chicken.y))

    if (edges.includes('interact') && chicken.peck < 0) {
      chicken.peck = 0
      chicken.squash = 0.18
      this.sound.peck()
    }

    this.step(dt, moving)
  }

  private slideTop(dt: number, braking: boolean): boolean {
    const chicken = this.chicken
    let x = braking ? 0 : this.axis('moveLeft', 'moveRight', this.nudgeX)
    let y = braking ? 0 : this.axis('moveUp', 'moveDown', this.nudgeY)
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2
      y *= Math.SQRT1_2
    }
    chicken.vx = x * MOVE_SPEED
    chicken.vy = y * MOVE_SPEED
    if (x !== 0) chicken.facing = x > 0 ? 1 : -1
    if (x !== 0 || y !== 0) chicken.aim = Math.atan2(chicken.vy, chicken.vx)
    chicken.x += chicken.vx * dt
    chicken.y += chicken.vy * dt
    chicken.onGround = true
    return x !== 0 || y !== 0
  }

  private easeCar(dt: number): void {
    if (this.gameId !== 'car') return
    const chicken = this.chicken
    const faceStep = dt * 8
    const faceDelta = chicken.facing - chicken.turn
    if (Math.abs(faceDelta) <= faceStep) chicken.turn = chicken.facing
    else chicken.turn += Math.sign(faceDelta) * faceStep
  }

  private applyBrake(edges: Action[]): boolean {
    if (!this.level.actions.includes('brake')) {
      this.chicken.braking = false
      return false
    }
    if (edges.includes('brake')) {
      this.brakeTime = 0.35
      this.nudgeTime = 0
      this.sound.brake()
    }
    const braking = this.input.isHeld('brake') || this.brakeTime > 0
    this.chicken.braking = braking
    return braking
  }

  private step(dt: number, stepping: boolean): void {
    this.chicken.moving = stepping
    if (!stepping) {
      this.stepTimer = 0.18
      return
    }
    this.chicken.walk += dt * 12
    this.stepTimer += dt
    if (this.stepTimer > 0.36) {
      this.stepTimer = 0
      this.sound.step()
    }
  }

  private touchProps(dt: number): void {
    const chicken = this.chicken
    const cy = this.level.camera === 'side' ? chicken.y - BODY_LIFT : chicken.y
    for (const prop of this.props) {
      const hit = Math.hypot(chicken.x - prop.x, cy - prop.y) < HIT_R + prop.r
      if (prop.kind === 'egg') {
        this.updateEgg(prop, hit, dt)
        continue
      }
      if (prop.kind === 'puddle') {
        this.updatePuddle(prop, hit, dt)
        continue
      }
      if (hit && !prop.touching) {
        prop.touching = true
        prop.react = 0.001
        this.sound.bush()
      } else if (!hit) {
        prop.touching = false
      }
      if (prop.react > 0) {
        prop.react += dt / 0.5
        if (prop.react >= 1) prop.react = 0
      }
    }
  }

  private updateEgg(prop: LiveProp, hit: boolean, dt: number): void {
    if (prop.life === 'egg') {
      if (hit && !prop.touching) {
        prop.touching = true
        prop.life = 'crack'
        prop.age = 0
        this.sound.egg()
      } else if (!hit) {
        prop.touching = false
      }
      return
    }

    prop.age += dt
    if (prop.life === 'crack' && prop.age >= 0.42) {
      prop.life = 'chick'
      prop.age = 0
      this.sound.peep()
    }
    if (prop.life === 'chick' && prop.age >= 3.1) {
      prop.life = 'egg'
      prop.age = 0
      this.relocateProp(prop)
    }
  }

  private updatePuddle(prop: LiveProp, hit: boolean, dt: number): void {
    if (prop.life === 'puddle') {
      prop.age += dt
      if (hit && !prop.touching) {
        prop.touching = true
        prop.life = 'splash'
        prop.age = 0
        this.chicken.squash = Math.max(this.chicken.squash, 0.12)
        this.sound.splash()
      } else if (!hit) {
        prop.touching = false
      }
      return
    }

    prop.age += dt
    if (prop.age >= 0.8) {
      prop.life = 'puddle'
      prop.age = 0
      this.relocateProp(prop)
    }
  }

  private relocateProp(prop: LiveProp): void {
    const side = this.level.camera === 'side'
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const x = side ? 180 + Math.random() * 920 : 200 + Math.random() * 880
      const y = side ? 536 : 190 + Math.random() * 360
      if (this.propSpotFree(prop, x, y)) {
        prop.x = x
        prop.y = y
        prop.touching = false
        return
      }
    }
  }

  private propSpotFree(prop: LiveProp, x: number, y: number): boolean {
    if (Math.hypot(prop.x - x, prop.y - y) < 180) return false
    const cy = this.level.camera === 'side' ? this.chicken.y - BODY_LIFT : this.chicken.y
    if (Math.hypot(this.chicken.x - x, cy - y) < HIT_R + prop.r + 70) return false
    return this.props.every((other) => {
      if (other === prop) return true
      return Math.hypot(other.x - x, other.y - y) > other.r + prop.r + 48
    })
  }
}
