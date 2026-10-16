import { isLocale, LOCALES, type Locale } from './copy'

const STORAGE_KEY = 'willum-play.lang'
const OLD_STORAGE_KEY = 'miniplay.lang'

export function localeFromPath(pathname = location.pathname): Locale | null {
  const parts = pathname.split('/').filter(Boolean)
  for (const part of parts) {
    if (isLocale(part)) return part
  }
  return null
}

export function pathIsAbout(pathname = location.pathname): boolean {
  const parts = pathname.split('/').filter(Boolean)
  const localeIndex = parts.findIndex((part) => isLocale(part))
  return localeIndex >= 0 && parts[localeIndex + 1] === 'om'
}

export function siteRoot(pathname = location.pathname): string {
  const parts = pathname.split('/').filter((part) => part && part !== 'index.html')
  const localeIndex = parts.findIndex((part) => isLocale(part))
  const prefix = localeIndex >= 0 ? parts.slice(0, localeIndex) : parts
  return prefix.length ? `/${prefix.join('/')}` : ''
}

export function localePath(locale: Locale, about = false): string {
  const rest = about ? `${locale}/om/` : `${locale}/`
  return `${siteRoot()}/${rest}`
}

export function publicUrl(file: string): string {
  const clean = file.replace(/^\//, '')
  const root = siteRoot()
  return `${root}/${clean}`
}

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY)
    if (isLocale(saved)) {
      if (localStorage.getItem(STORAGE_KEY) !== saved) localStorage.setItem(STORAGE_KEY, saved)
      if (localStorage.getItem(OLD_STORAGE_KEY)) localStorage.removeItem(OLD_STORAGE_KEY)
      return saved
    }
  } catch {
    /* private mode */
  }
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of list) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'zh') return 'zh'
    if (isLocale(base)) return base
  }
  return 'da'
}

export function rememberLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* private mode */
  }
}

export { LOCALES }
