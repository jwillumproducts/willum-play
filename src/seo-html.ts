import { BRAND, COPY, LOCALES, NATIVE_NAME, type Locale } from './copy'

function prefixFromBase(basePath: string): string {
  if (!basePath || basePath === './' || basePath === '.' || basePath === '/') return ''
  return `/${basePath.replace(/^\/+|\/+$/g, '')}`
}

function abs(origin: string, prefix: string, path: string): string {
  const rest = path.startsWith('/') ? path : `/${path}`
  return `${origin}${prefix}${rest}`
}

function hreflang(origin: string, prefix: string, page: 'front' | 'about'): string {
  const suffix = page === 'about' ? 'om/' : ''
  const links = LOCALES.map(
    (locale) =>
      `<link rel="alternate" hreflang="${COPY[locale].htmlLang}" href="${abs(origin, prefix, `/${locale}/${suffix}`)}">`,
  )
  links.push(`<link rel="alternate" hreflang="x-default" href="${abs(origin, prefix, '/da/')}">`)
  return links.join('\n')
}

function jsonLd(locale: Locale): string {
  const copy = COPY[locale]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: BRAND,
    applicationCategory: 'Game',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    description: copy.seoDescription,
    inLanguage: LOCALES.map((item) => COPY[item].htmlLang),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

function staticFront(locale: Locale, prefix: string): string {
  const copy = COPY[locale]
  return `<main>
      <h1>${BRAND}</h1>
      ${copy.intro.map((paragraph) => `<p>${paragraph}</p>`).join('\n      ')}
      <nav aria-label="${copy.language}">
        ${LOCALES.map((item) => `<a href="${prefix}/${item}/" hreflang="${COPY[item].htmlLang}">${NATIVE_NAME[item]}</a>`).join('\n        ')}
      </nav>
      <p>${copy.chooseDevice}: ${copy.chooseDeviceNote}</p>
      <p>${copy.credit}</p>
    </main>`
}

function staticAbout(locale: Locale, prefix: string): string {
  const copy = COPY[locale]
  return `<main>
      <h1>${copy.seoAboutTitle}</h1>
      ${copy.intro.map((paragraph) => `<p>${paragraph}</p>`).join('\n      ')}
      <p><a href="${prefix}/${locale}/">${copy.chooseDevice}</a></p>
      <p>${copy.credit}</p>
    </main>`
}

export function pageDocument(
  locale: Locale,
  page: 'front' | 'about',
  assets: string,
  origin: string,
  basePath = '',
): string {
  const copy = COPY[locale]
  const prefix = prefixFromBase(basePath)
  const path = page === 'about' ? `/${locale}/om/` : `/${locale}/`
  const title = page === 'about' ? copy.seoAboutTitle : copy.seoTitle
  const body = page === 'about' ? staticAbout(locale, prefix) : staticFront(locale, prefix)
  return `<!doctype html>
<html lang="${copy.htmlLang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
    <title>${title}</title>
    <meta name="description" content="${copy.seoDescription}">
    <link rel="canonical" href="${abs(origin, prefix, path)}">
    ${hreflang(origin, prefix, page)}
    <meta property="og:type" content="website">
    <meta property="og:locale" content="${copy.ogLocale}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${copy.seoDescription}">
    <meta property="og:url" content="${abs(origin, prefix, path)}">
    <meta property="og:image" content="${abs(origin, prefix, '/share.svg')}">
    <meta name="twitter:card" content="summary_large_image">
    ${jsonLd(locale)}
    ${assets}
  </head>
  <body>
    <div id="app">
      ${body}
    </div>
  </body>
</html>
`
}

export function robotsTxt(origin: string, basePath = ''): string {
  const prefix = prefixFromBase(basePath)
  return `User-agent: *\nAllow: /\n\nSitemap: ${abs(origin, prefix, '/sitemap.xml')}\n`
}

export function sitemapXml(origin: string, basePath = ''): string {
  const prefix = prefixFromBase(basePath)
  const urls = LOCALES.flatMap((locale) => [`/${locale}/`, `/${locale}/om/`])
  const body = urls
    .map((path) => `  <url><loc>${abs(origin, prefix, path)}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}
