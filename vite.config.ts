import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { LOCALES } from './src/copy'
import { pageDocument, robotsTxt, sitemapXml } from './src/seo-html'

const basePath = process.env.BASE_PATH || './'

function seoPages(): Plugin {
  return {
    name: 'willum-play-seo',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve('dist')
      const built = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      const assets = [...built.matchAll(/<link rel="stylesheet"[^>]*>|<script type="module"[^>]*><\/script>/g)]
        .map((match) => match[0])
        .join('\n')
      const origin = (process.env.SITE_URL ?? '').replace(/\/$/, '')
      for (const locale of LOCALES) {
        writePage(dist, `${locale}/index.html`, pageDocument(locale, 'front', assetsFor(assets, `${locale}/index.html`), origin, basePath))
        writePage(
          dist,
          `${locale}/om/index.html`,
          pageDocument(locale, 'about', assetsFor(assets, `${locale}/om/index.html`), origin, basePath),
        )
      }
      fs.writeFileSync(path.join(dist, 'robots.txt'), robotsTxt(origin, basePath))
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemapXml(origin, basePath))
    },
  }
}

function assetsFor(assets: string, file: string): string {
  const relative = !basePath || basePath === './' || basePath === '.'
  if (!relative) return assets
  const depth = file.split('/').length - 1
  const prefix = '../'.repeat(depth)
  return assets
    .replaceAll('="./', `="${prefix}`)
    .replaceAll("='./", `='${prefix}`)
    .replaceAll('="/assets/', `="${prefix}assets/`)
    .replaceAll("='/assets/", `='${prefix}assets/`)
}

function writePage(dist: string, file: string, html: string): void {
  const target = path.join(dist, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, html)
}

export default defineConfig({
  base: basePath,
  server: {
    port: 5174,
    strictPort: true,
  },
  plugins: [seoPages()],
})
