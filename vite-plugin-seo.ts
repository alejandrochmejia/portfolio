import type { Plugin } from 'vite'
import type { Lang } from './src/l10n.ts'
import { langOfPath } from './src/seo/site.ts'
import { renderBody, renderHead, renderRobots, renderSitemap } from './src/seo/render.ts'

/** Fills index.html's `<!--seo:head--><!--/seo:head-->` / `seo:body` slots for each
 *  language and emits `/en/index.html`, `sitemap.xml` and `robots.txt`.
 *  In dev the slots follow the requested path, so `/en/` previews the English head. */
const HEAD = /<!--seo:head-->[\s\S]*?<!--\/seo:head-->/
const BODY = /<!--seo:body-->[\s\S]*?<!--\/seo:body-->/

const slots = (lang: Lang) => ({
  head: `<!--seo:head-->${renderHead(lang)}<!--/seo:head-->`,
  body: `<!--seo:body-->${renderBody(lang)}<!--/seo:body-->`,
})

function fill(html: string, lang: Lang) {
  const s = slots(lang)
  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(HEAD, () => s.head)
    .replace(BODY, () => s.body)
}

const strip = (html: string) => html.replace(/<!--\/?seo:(head|body)-->/g, '')

export function seo(): Plugin {
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html, ctx) {
      return fill(html, langOfPath(ctx.originalUrl ?? ctx.path))
    },
    // `post`: Vite's own HTML plugin emits index.html in this same hook.
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const index = bundle['index.html']
        if (!index || index.type !== 'asset') return
        const es = String(index.source)
        if (!HEAD.test(es) || !BODY.test(es)) this.error('index.html is missing the seo slots')
        index.source = strip(es)
        this.emitFile({ type: 'asset', fileName: 'en/index.html', source: strip(fill(es, 'en')) })
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap(new Date().toISOString().slice(0, 10)) })
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: renderRobots() })
      },
    },
  }
}
