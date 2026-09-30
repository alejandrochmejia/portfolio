import { LANGS, type Lang } from '../l10n.ts'
import { ABOUT_FACTS } from '../components/aboutData.ts'
import { PROJECTS } from '../components/projectsData.ts'
import { EXPERIENCE, KIND_LABEL, fmtRange } from '../components/experienceData.ts'
import { KIND, TECH } from '../components/techData.ts'
import { META, OG_IMAGE, PERSON, PROFILES, SITE_URL, pageUrl } from './site.ts'

/** Build-time HTML for each language (used by vite-plugin-seo.ts): the <head>
 *  tags, the JSON-LD graph and a static, semantic copy of the page's content.
 *  The app is a client-rendered WebGL experience, so without this the HTML a
 *  crawler, a link preview or an AI agent fetches would be an empty <div>. */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const COPY = {
  es: {
    about: 'Sobre mí',
    projects: 'Proyectos',
    tech: 'Tecnologías',
    experience: 'Experiencia',
    contact: 'Contacto',
    stack: 'Stack',
    demo: 'Sitio web',
    repo: 'Código fuente',
    projectsList: 'Proyectos de Alejandro Chávez',
  },
  en: {
    about: 'About me',
    projects: 'Projects',
    tech: 'Tech stack',
    experience: 'Experience',
    contact: 'Contact',
    stack: 'Stack',
    demo: 'Website',
    repo: 'Source code',
    projectsList: 'Projects by Alejandro Chávez',
  },
}

/** <title>, description, canonical, hreflang, Open Graph and Twitter tags. */
export function renderHead(lang: Lang): string {
  const m = META[lang]
  const other = LANGS.find((l) => l !== lang)!
  const img = SITE_URL + OG_IMAGE.path
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="author" content="${esc(PERSON.name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${pageUrl(lang)}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl('es')}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${esc(PERSON.name)}" />`,
    `<meta property="og:url" content="${pageUrl(lang)}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:locale" content="${m.locale}" />`,
    `<meta property="og:locale:alternate" content="${META[other].locale}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${esc(m.ogImageAlt)}" />`,
    `<meta property="profile:first_name" content="${esc(PERSON.givenName)}" />`,
    `<meta property="profile:last_name" content="${esc(PERSON.familyName)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<script type="application/ld+json">${jsonLd(lang)}</script>`,
  ]
  return tags.join('\n    ')
}

/** schema.org graph: the site, the profile page and the person behind it. */
export function jsonLd(lang: Lang): string {
  const m = META[lang]
  const url = pageUrl(lang)
  const personId = `${SITE_URL}/#person`
  const current = EXPERIENCE.find((x) => x.current && x.kind === 'work')
  const school = EXPERIENCE.find((x) => x.kind === 'education')
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL + '/',
      name: PERSON.name,
      inLanguage: LANGS,
      publisher: { '@id': personId },
    },
    {
      '@type': 'ProfilePage',
      '@id': `${url}#profile`,
      url,
      name: m.title,
      description: m.description,
      inLanguage: lang,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: { '@id': personId },
      primaryImageOfPage: { '@type': 'ImageObject', url: SITE_URL + OG_IMAGE.path },
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: PERSON.name,
      givenName: PERSON.givenName,
      familyName: PERSON.familyName,
      url: SITE_URL + '/',
      email: `mailto:${PERSON.email}`,
      jobTitle: m.jobTitle,
      description: m.description,
      birthPlace: PERSON.birthPlace,
      address: {
        '@type': 'PostalAddress',
        addressLocality: PERSON.city,
        addressRegion: PERSON.region,
        addressCountry: PERSON.country,
      },
      ...(current && { worksFor: { '@type': 'Organization', name: current.org } }),
      ...(school && {
        alumniOf: { '@type': 'CollegeOrUniversity', name: school.place.es.split(' · ')[0] },
      }),
      knowsAbout: TECH.map((t) => t.name),
      knowsLanguage: ['es', 'en'],
      sameAs: Object.values(PROFILES),
    },
    {
      '@type': 'ItemList',
      '@id': `${url}#projects`,
      name: COPY[lang].projectsList,
      itemListElement: PROJECTS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'CreativeWork',
          name: p.title,
          description: p.blurb[lang],
          dateCreated: p.year,
          ...(p.demo || p.repo ? { url: p.demo ?? p.repo } : {}),
          ...(p.repo && { codeRepository: p.repo }),
          keywords: p.stack.join(', '),
          creator: { '@id': personId },
        },
      })),
    },
  ]
  // `<` escaped so a string can never close the <script> early.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
}

/** The page's content as plain semantic HTML, inside #root. React replaces it on
 *  mount; until then (and without JS) it's what crawlers and no-JS readers get. */
export function renderBody(lang: Lang): string {
  const m = META[lang]
  const t = COPY[lang]
  const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`

  const projects = PROJECTS.map((p) => {
    const links = [p.demo && link(p.demo, t.demo), p.repo && link(p.repo, t.repo)].filter(Boolean)
    return `<article>
<h3>${esc(p.title)}</h3>
<p>${esc(p.role[lang])} · ${esc(p.year)}</p>
<p>${esc(p.blurb[lang])}</p>
${p.contribution ? `<p>${esc(p.contribution[lang])}</p>` : ''}
${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${esc(h[lang])}</li>`).join('')}</ul>` : ''}
<p>${t.stack}: ${esc(p.stack.join(', '))}</p>
${links.length ? `<p>${links.join(' · ')}</p>` : ''}
</article>`
  }).join('\n')

  const experience = EXPERIENCE.map(
    (x) => `<li>
<h3>${esc(x.org)} — ${esc(x.role[lang])}</h3>
<p>${esc(KIND_LABEL[x.kind][lang])} · <time datetime="${x.start}">${esc(fmtRange(x, lang))}</time> · ${esc(x.place[lang])}</p>
<p>${esc(x.summary[lang])}</p>
</li>`,
  ).join('\n')

  const tech = TECH.map((x) => `<li>${esc(x.name)} (${esc(KIND[x.kind][lang])})</li>`).join('')

  const contact = [
    link(`mailto:${PERSON.email}`, PERSON.email),
    link(PROFILES.github, 'GitHub'),
    link(PROFILES.linkedin, 'LinkedIn'),
    link(PROFILES.instagram, 'Instagram'),
  ].map((a) => `<li>${a}</li>`).join('')

  return `<div class="seo-static">
<header><h1>${esc(m.title)}</h1><p>${esc(m.description)}</p></header>
<main>
<section id="about-me"><h2>${t.about}</h2><ul>${ABOUT_FACTS.map((f) => `<li>${esc(f[lang])}</li>`).join('')}</ul></section>
<section id="projects"><h2>${t.projects}</h2>
${projects}
</section>
<section id="tech-stack"><h2>${t.tech}</h2><ul>${tech}</ul></section>
<section id="experience"><h2>${t.experience}</h2><ol>
${experience}
</ol></section>
<section id="contact"><h2>${t.contact}</h2><ul>${contact}</ul></section>
</main>
</div>`
}

/** sitemap.xml with both languages cross-linked as alternates. */
export function renderSitemap(lastmod: string): string {
  const alts = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('es')}"/>`)
    .join('\n')
  const urls = LANGS.map(
    (l) => `  <url>
    <loc>${pageUrl(l)}</loc>
    <lastmod>${lastmod}</lastmod>
${alts}
  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

export function renderRobots(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
}
