import type { Locale } from './copy'

const FLAG: Record<Locale, string> = {
  da: '<rect width="60" height="40" fill="#c60c30"/><rect x="18" width="8" height="40" fill="#fff"/><rect y="16" width="60" height="8" fill="#fff"/>',
  en: '<rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8102e" stroke-width="4"/><path d="M30 0 V40 M0 20 H60" stroke="#fff" stroke-width="14"/><path d="M30 0 V40 M0 20 H60" stroke="#c8102e" stroke-width="8"/>',
  es: '<rect width="60" height="40" fill="#c60b1e"/><rect y="10" width="60" height="20" fill="#ffc400"/>',
  de: '<rect width="60" height="13.4" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#dd0000"/><rect y="26.6" width="60" height="13.4" fill="#ffce00"/>',
  zh: '<rect width="60" height="40" fill="#de2910"/><polygon points="12,5 14.2,11.6 21.2,11.6 15.5,15.7 17.7,22.3 12,18.2 6.3,22.3 8.5,15.7 2.8,11.6 9.8,11.6" fill="#ffde00"/>',
  hi: '<rect width="60" height="13.4" fill="#ff9933"/><rect y="13.3" width="60" height="13.4" fill="#fff"/><rect y="26.6" width="60" height="13.4" fill="#138808"/><circle cx="30" cy="20" r="4.5" fill="none" stroke="#000080" stroke-width="1.4"/>',
  fr: '<rect width="20" height="40" fill="#0055a4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ef4135"/>',
}

export function flagSvg(locale: Locale): string {
  return `<svg viewBox="0 0 60 40" aria-hidden="true">${FLAG[locale]}</svg>`
}
