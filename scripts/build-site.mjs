// Builds the gallery into _site/, the folder GitHub Pages publishes.
//
//   pages         each page in site/*.html rendered in every language of site/i18n/: English at the
//                 root, the others under /ko/, /ja/, /zh-hans/ and /zh-hant/, each with its own title,
//                 description, hreflang links to the others, structured data, and a plain list of
//                 the schemes a search engine reads without running the page
//   schemes.json  every scheme with its colors and credit, which the pages read
//   llms.txt      a summary of the collection with a link to every file, for language models
//   sitemap.xml   every page in every language, with the other languages of each
//   404.html      the page for an address that does not exist
//
//   node scripts/build-site.mjs

import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SCHEMES_DIR, SCHEMES_PATH, checkSchemes } from './lib/schemes.mjs'

const SITE_URL = 'https://jooy2.github.io/xcasca-color-scheme/'
const REPO_URL = 'https://github.com/jooy2/xcasca-color-scheme'
const SITE_DIR = join(ROOT, 'site')
const OUT = join(ROOT, '_site')

// The languages, in the order the language menu lists them. `path` is where each one lives
const LANGUAGES = [
  { code: 'en', path: '', locale: 'en_US' },
  { code: 'ko', path: 'ko/', locale: 'ko_KR' },
  { code: 'ja', path: 'ja/', locale: 'ja_JP' },
  { code: 'zh-Hans', path: 'zh-hans/', locale: 'zh_CN' },
  { code: 'zh-Hant', path: 'zh-hant/', locale: 'zh_TW' },
  { code: 'es', path: 'es/', locale: 'es_ES' },
  { code: 'de', path: 'de/', locale: 'de_DE' },
  { code: 'fr', path: 'fr/', locale: 'fr_FR' },
]

// The pages built from site/, and where each sits under a language's path
const PAGES = [
  { template: 'index.html', path: '', meta: 'meta.', list: true },
  { template: 'editor.html', path: 'editor/', meta: 'editor.meta.', list: false },
]

const STEPS = {
  desktop: ['1-open-manager', '2-import', '3-imported', '4-properties', '5-apply', '6-applied'].map((name) => ({
    image: `desktop-${name}.png`,
    width: 1440,
    height: 900,
  })),
  android: ['1-open-menu', '2-import', '3-imported', '4-edit', '5-apply', '6-applied'].map((name) => ({
    image: `android-${name}.png`,
    width: 540,
    height: 1212,
  })),
}

const KIND_LABEL = { 'built-in': 'built into Xcasca', community: 'community', original: 'original' }
const { errors, schemes } = checkSchemes()

if (errors.length > 0) {
  console.error('Fix what `npm run validate` reports first.')
  process.exit(1)
}

const escapeHtml = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const urlPath = (path) => path.split('/').map(encodeURIComponent).join('/')
const jsonForScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

// The date of the last commit, or today outside a repository
const lastModified = (() => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
})()

const translations = Object.fromEntries(
  LANGUAGES.map(({ code }) => [code, JSON.parse(readFileSync(join(SITE_DIR, 'i18n', `${code}.json`), 'utf8'))]),
)

// Every key English has, every other language has too
for (const { code } of LANGUAGES.slice(1)) {
  const missing = Object.keys(translations.en).filter((key) => !(key in translations[code]))
  const missingRuntime = Object.keys(translations.en.runtime).filter((key) => !(key in translations[code].runtime))

  if (missing.length || missingRuntime.length) {
    console.error(`site/i18n/${code}.json lacks ${[...missing, ...missingRuntime.map((key) => `runtime.${key}`)].join(', ')}`)
    process.exit(1)
  }
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// The templates, the translations and the icons are built into the pages rather than served
const SKIP = new Set(['i18n', 'icons', ...PAGES.map((page) => page.template)])

cpSync(SITE_DIR, OUT, { recursive: true, filter: (path) => path === SITE_DIR || !SKIP.has(path.slice(SITE_DIR.length + 1).split('/')[0]) })
cpSync(join(ROOT, 'docs', 'images'), join(OUT, 'images'), { recursive: true })
cpSync(SCHEMES_DIR, join(OUT, SCHEMES_PATH), { recursive: true })

const list = schemes
  .map(({ name, fileName, data, dark, credit }) => ({
    name,
    file: `${SCHEMES_PATH}/${fileName}`,
    dark,
    kind: credit.kind,
    author: credit.author,
    url: credit.url,
    license: credit.license,
    colors: data,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

writeFileSync(join(OUT, 'schemes.json'), `${JSON.stringify({ terminal: list }, null, 2)}\n`)

// --- pages -------------------------------------------------------------------------------------

// Each {{icon:name}} becomes the SVG in site/icons/, drawn in the text color
const icon = (name) =>
  readFileSync(join(SITE_DIR, 'icons', `${name}.svg`), 'utf8')
    .replace(/<!--.*?-->\s*/s, '')
    .replace(/<title>.*?<\/title>/s, '')
    // Only the outer tag loses its size and class; a rect inside keeps its own
    .replace(/<svg[^>]*>/, (tag) =>
      tag
        .replace(/\s+(width|height|class|role)="[^"]*"/g, '')
        .replace('<svg', `<svg class="icon" aria-hidden="true" focusable="false"${name === 'github' ? ' fill="currentColor"' : ''}`),
    )
    .replace(/\n\s*/g, ' ')
    .trim()

const pageUrl = (language, page) => `${SITE_URL}${language.path}${page.path}`
// From a page to the site's root, such as ../ from /ko/
const rootFrom = (language, page) => '../'.repeat(`${language.path}${page.path}`.split('/').length - 1)

const renderPage = (template, language, page) => {
  const t = translations[language.code]
  const root = rootFrom(language, page)
  const text = (key) => {
    if (!(key in t)) {
      throw new Error(`${page.template}: no translation for ${key}`)
    }

    return String(t[key])
  }

  const head = [
    `<link rel="canonical" href="${pageUrl(language, page)}">`,
    ...LANGUAGES.map((other) => `<link rel="alternate" hreflang="${other.code}" href="${pageUrl(other, page)}">`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(LANGUAGES[0], page)}">`,
    `<meta property="og:url" content="${pageUrl(language, page)}">`,
    `<meta property="og:locale" content="${language.locale}">`,
    ...LANGUAGES.filter((other) => other !== language).map(
      (other) => `<meta property="og:locale:alternate" content="${other.locale}">`,
    ),
  ].join('\n    ')

  const langMenu = [
    '<details class="lang-menu">',
    `<summary aria-label="${escapeHtml(t['nav.language'])}">${icon('languages')}<span>${escapeHtml(t['lang.name'])}</span>${icon('chevron-down')}</summary>`,
    '<ul>',
    ...LANGUAGES.map((other) => {
      const href = `${root}${other.path}${page.path}` || './'
      const current = other === language ? ' aria-current="page"' : ''

      return `<li><a href="${href}" hreflang="${other.code}" lang="${other.code}" data-lang-link="${other.code}"${current}>${escapeHtml(translations[other.code]['lang.name'])}</a></li>`
    }),
    '</ul>',
    '</details>',
  ].join('')

  // The download for other apps; formats.js fills in the list
  const formatMenu = [
    '<details class="format-menu" id="formats">',
    '<summary class="button">{{icon:package}}<span>{{t:export.label}}</span>{{icon:chevron-down}}</summary>',
    '<div class="format-panel"><div class="format-list"></div><p class="format-note">{{t:export.note}}</p></div>',
    '</details>',
  ].join('')

  const steps = (platform) =>
    STEPS[platform]
      .map(
        ({ image, width, height }, index) =>
          `<li><img src="${root}images/${image}" width="${width}" height="${height}" loading="lazy" alt="${escapeHtml(text(`steps.${platform}.${index + 1}.alt`))}"><p>${text(`steps.${platform}.${index + 1}`)}</p></li>`,
      )
      .join('')

  // The English page offers the visitor's own language; the others need no offer
  const suggestions =
    language.code === 'en'
      ? Object.fromEntries(
          LANGUAGES.slice(1).map((other) => [
            other.code,
            { text: translations[other.code]['suggest.text'], action: translations[other.code]['suggest.action'], href: `${root}${other.path}${page.path}` },
          ]),
        )
      : {}

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        name: 'Xcasca Color Scheme Gallery',
        url: SITE_URL,
        author: { '@type': 'Person', name: 'jooy2', url: 'https://github.com/jooy2' },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl(language, page)}#page`,
        url: pageUrl(language, page),
        name: text(`${page.meta}title`),
        description: text(`${page.meta}description`),
        inLanguage: language.code,
        isPartOf: { '@id': `${SITE_URL}#website` },
        primaryImageOfPage: `${SITE_URL}images/social-preview.png`,
      },
      page.list && {
        '@type': 'ItemList',
        name: text('gallery.label'),
        numberOfItems: list.length,
        itemListElement: list.map((scheme, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: scheme.name,
          url: `${pageUrl(language, page)}#${encodeURIComponent(scheme.name)}`,
        })),
      },
    ].filter(Boolean),
  }

  return template
    .replaceAll('{{lang}}', language.code)
    .replaceAll('{{langCode}}', language.code)
    .replaceAll('{{root}}', root)
    .replace('{{head}}', head)
    .replace('{{langMenu}}', langMenu)
    .replace('{{formatMenu}}', formatMenu)
    .replace('{{steps:desktop}}', steps('desktop'))
    .replace('{{steps:android}}', steps('android'))
    .replace('{{runtime}}', jsonForScript({ lang: language.code, strings: { ...t.runtime, siteName: t['meta.ogTitle'] }, suggestions }))
    .replace('<!-- structured-data -->', `<script type="application/ld+json">${jsonForScript(structuredData)}</script>`)
    .replace(
      '<!-- scheme-list -->',
      list.map((scheme) => `<li><a class="static" href="#${encodeURIComponent(scheme.name)}">${escapeHtml(scheme.name)}</a></li>`).join(''),
    )
    // The first Xcasca in the text leads to the app's site, in a new tab
    .replace(/\{\{xcasca:([a-zA-Z0-9.-]+)\}\}/g, (_, key) =>
      text(key).replace('Xcasca', '<a class="xcasca-link" href="https://www.xcasca.com" target="_blank" rel="noopener">Xcasca</a>'),
    )
    .replace(/\{\{a:([a-zA-Z0-9.-]+)\}\}/g, (_, key) => escapeHtml(text(key)))
    .replace(/\{\{t:([a-zA-Z0-9.-]+)\}\}/g, (_, key) => text(key))
    .replace(/\{\{icon:([a-z0-9-]+)\}\}/g, (_, name) => icon(name))
}

for (const page of PAGES) {
  const template = readFileSync(join(SITE_DIR, page.template), 'utf8')

  for (const language of LANGUAGES) {
    const dir = join(OUT, language.path, page.path)
    const html = renderPage(template, language, page)
    const leftover = html.match(/\{\{[^}]+\}\}/)

    if (leftover) {
      throw new Error(`${page.template} (${language.code}): ${leftover[0]} was not filled in`)
    }

    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }
}

// --- llms.txt ----------------------------------------------------------------------------------

const llms = [
  '# Xcasca Color Scheme Gallery',
  '',
  `> A collection of terminal color schemes for Xcasca, the SSH terminal for desktop and mobile. Each scheme is a \`.xccolorscheme\` file that Xcasca 1.1.2 or later imports on macOS, Windows, Linux, Android and iOS. The gallery previews every scheme on the same sample terminal session and links to its file. It is an unofficial project, unrelated to the company behind Xcasca.`,
  '',
  'A `.xccolorscheme` file is JSON with `app` ("xcasca"), `type` ("terminalColor"), `version` (1), `name`, and `data`, which holds 22 colors as `#RRGGBB`: foreground, background, selection (which may carry alpha as `#RRGGBBAA`), the eight ANSI colors, their eight bright variants, and three search highlight colors. To use one, download it, open Terminal Color Schemes in Xcasca, import the file, and choose the scheme in a session\'s Appearance settings.',
  '',
  `The gallery is available in English, Korean, Japanese, Simplified Chinese, Traditional Chinese, Spanish, German and French, and has an [editor](${SITE_URL}editor/) that makes a new scheme from any of these and downloads it as a \`.xccolorscheme\` file.`,
  '',
  'Every scheme, and every scheme made in the editor, can also be downloaded for Xshell (`.xcs`), Windows Terminal (a `schemes` entry for `settings.json`), iTerm2 (`.itermcolors`), Ghostty, Alacritty, Kitty and WezTerm. The selection becomes a solid color mixed with the background, and the search highlight colors, which only Xcasca has, are left out.',
  '',
  '## Docs',
  '',
  `- [README](${REPO_URL}#readme): what the collection is and how to apply a scheme on the desktop and on Android, with screenshots`,
  `- [Contributing](${REPO_URL}/blob/main/CONTRIBUTING.md): how to make a scheme in Xcasca, export it, and the rules every file follows`,
  `- [Credits](${REPO_URL}/blob/main/CREDITS.md): the author and license of every scheme`,
  `- [Scheme index](${SITE_URL}schemes.json): every scheme as JSON, with its colors, author and license`,
  '',
  '## Color schemes',
  '',
  ...list.map(
    (scheme) =>
      `- [${scheme.name}](${SITE_URL}${urlPath(scheme.file)}): ${scheme.dark ? 'dark' : 'light'}, ${KIND_LABEL[scheme.kind]}, by ${scheme.author} (${scheme.license})`,
  ),
  '',
].join('\n')

writeFileSync(join(OUT, 'llms.txt'), llms)

// --- sitemap.xml and 404.html ------------------------------------------------------------------

writeFileSync(
  join(OUT, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...PAGES.flatMap((page) =>
      LANGUAGES.map((language) =>
        [
          '  <url>',
          `    <loc>${pageUrl(language, page)}</loc>`,
          `    <lastmod>${lastModified}</lastmod>`,
          ...LANGUAGES.map((other) => `    <xhtml:link rel="alternate" hreflang="${other.code}" href="${pageUrl(other, page)}"/>`),
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(LANGUAGES[0], page)}"/>`,
          '  </url>',
        ].join('\n'),
      ),
    ),
    '</urlset>',
    '',
  ].join('\n'),
)

writeFileSync(
  join(OUT, '404.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Page not found · Xcasca Color Scheme Gallery</title>
    <link rel="icon" href="${SITE_URL}favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="${SITE_URL}style.css">
  </head>
  <body>
    <main class="not-found">
      <h1>Page not found</h1>
      <p>This address is not part of the gallery. <a href="${SITE_URL}">Go to the Xcasca Color Scheme Gallery</a>.</p>
    </main>
  </body>
</html>
`,
)

// Served as files, not run through Jekyll
writeFileSync(join(OUT, '.nojekyll'), '')
console.log(`Built _site/ with ${list.length} color schemes in ${LANGUAGES.length} languages.`)
