import type { KeyCap, PadBrand } from './types'

const arrow = '<path fill="currentColor" d="M9.2 3.2 21 12 9.2 20.8V15H3v-6h6.2V3.2z"/>'

function svg(body: string, face = false): string {
  return `<svg class="${face ? 'face' : 'ink'}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`
}

function turned(degrees: number): string {
  return svg(`<g transform="rotate(${degrees} 12 12)">${arrow}</g>`)
}

const enter = svg(
  '<path fill="currentColor" d="M20 5v6.2A3.2 3.2 0 0 1 16.8 14.4H8.6l3.1 3.1-2.2 2.2L3.2 13.4l6.3-6.3 2.2 2.2-3.1 3.1h8.2a1.2 1.2 0 0 0 1.2-1.2V5H20z"/>',
)

const space = `<svg class="ink bar" viewBox="0 0 48 12" aria-hidden="true"><rect width="48" height="12" rx="6" fill="currentColor"/></svg>`

function disc(color: string, letter: string): string {
  return svg(
    `<circle cx="12" cy="12" r="11" fill="${color}"/><text x="12" y="12" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="13" font-weight="700" font-family="Arial, sans-serif">${letter}</text>`,
    true,
  )
}

const cross = svg(
  '<path fill="none" stroke="#0072CE" stroke-width="4.2" stroke-linecap="round" d="M6 6 18 18M18 6 6 18"/>',
  true,
)

const circle = svg('<circle cx="12" cy="12" r="7.4" fill="none" stroke="#E10600" stroke-width="3.8"/>', true)

export const KEY_ICON: Record<KeyCap, string> = {
  left: turned(180),
  right: turned(0),
  up: turned(-90),
  down: turned(90),
  space,
  enter,
}

const directions = {
  left: KEY_ICON.left,
  right: KEY_ICON.right,
  up: KEY_ICON.up,
  down: KEY_ICON.down,
}

export const PAD_ICON: Record<PadBrand, Record<KeyCap, string>> = {
  playstation: {
    ...directions,
    space: cross,
    enter: circle,
  },
  xbox: {
    ...directions,
    space: disc('#107C10', 'A'),
    enter: disc('#E81123', 'B'),
  },
}
