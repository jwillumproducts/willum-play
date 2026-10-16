export interface ClipBank {
  peck: string
  peep?: string
}

export class Sound {
  muted = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bank: ClipBank | null = null
  private clips = new Map<string, AudioBuffer>()
  private loading = new Set<string>()

  unlock(): void {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext()
        this.master = this.ctx.createGain()
        this.master.connect(this.ctx.destination)
      }
      void this.ctx.resume()
      this.applyMute()
    } catch {
      this.ctx = null
      this.master = null
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyMute()
  }

  use(bank: ClipBank): void {
    this.bank = bank
    this.load(bank.peck)
    if (bank.peep) this.load(bank.peep)
  }

  step(): void {
    this.noise(0.045, 0.035, 420)
  }

  jump(): void {
    this.sweep(280, 520, 0.16, 0.05)
  }

  land(): void {
    this.noise(0.07, 0.04, 220)
  }

  brake(): void {
    this.noise(0.09, 0.06, 160)
  }

  egg(): void {
    this.tone(523, 0.12, 0.06)
    window.setTimeout(() => this.tone(659, 0.16, 0.05), 70)
  }

  peep(): void {
    if (this.playClip(this.bank?.peep)) return
    this.tone(880, 0.08, 0.045)
    window.setTimeout(() => this.tone(1170, 0.1, 0.035), 90)
  }

  bush(): void {
    this.noise(0.1, 0.04, 520)
  }

  splash(): void {
    this.noise(0.14, 0.055, 980)
    this.tone(392, 0.1, 0.035)
    window.setTimeout(() => this.tone(523, 0.12, 0.03), 50)
  }

  peck(): void {
    if (this.playClip(this.bank?.peck)) return
    this.tone(740, 0.07, 0.05)
    this.tone(480, 0.09, 0.04)
  }

  private load(url: string): void {
    if (this.clips.has(url) || this.loading.has(url)) return
    this.unlock()
    const ctx = this.ctx
    if (!ctx) return
    this.loading.add(url)
    void fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('lyd')
        return response.arrayBuffer()
      })
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        this.clips.set(url, buffer)
      })
      .catch(() => {
        this.loading.delete(url)
      })
  }

  private playClip(url: string | undefined): boolean {
    if (!url) return false
    if (this.muted) return true
    const buffer = this.clips.get(url)
    const ctx = this.ctx
    const master = this.master
    if (!buffer || !ctx || !master) return false
    void ctx.resume()
    const source = ctx.createBufferSource()
    const amp = ctx.createGain()
    source.buffer = buffer
    amp.gain.value = 0.95
    source.connect(amp)
    amp.connect(master)
    source.start()
    return true
  }

  private applyMute(): void {
    if (!this.master || !this.ctx) return
    const target = this.muted ? 0 : 0.9
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02)
  }

  private tone(freq: number, dur: number, gain: number): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)
    amp.gain.setValueAtTime(gain, now)
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur)
    osc.connect(amp)
    amp.connect(master)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }

  private sweep(from: number, to: number, dur: number, gain: number): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(from, now)
    osc.frequency.exponentialRampToValueAtTime(to, now + dur)
    amp.gain.setValueAtTime(gain, now)
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur)
    osc.connect(amp)
    amp.connect(master)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }

  private noise(dur: number, gain: number, freq: number): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.muted) return
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq
    const amp = ctx.createGain()
    amp.gain.value = gain
    source.connect(filter)
    filter.connect(amp)
    amp.connect(master)
    source.start()
  }
}
