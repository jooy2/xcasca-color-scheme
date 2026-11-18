// Builds the gallery into _site/, the folder GitHub Pages publishes: the page, the sample session,
// the screenshots, every scheme file, and the files written from the scheme list:
//
//   schemes.json  every scheme with its colors and credit, which the page reads
//   index.html    the page, with the scheme count, a plain list of the schemes and structured data
//                 filled in, so a search engine reads them without running the page
//   llms.txt      a summary of the collection with a link to every file, for language models
//   sitemap.xml   the page's address, for search engines
//   404.html      the page for an address that does not exist
//
//   node scripts/build-site.mjs

import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SCHEMES_DIR, SCHEMES_PATH, checkSchemes } from './lib/schemes.mjs'

const SITE_URL = 'https://jooy2.github.io/xcasca-color-scheme/'
const REPO_URL = 'https://github.com/jooy2/xcasca-color-scheme'
const OUT = join(ROOT, '_site')
const KIND_LABEL = { 'built-in': 'built into Xcasca', community: 'community', original: 'original' }
const { errors, schemes } = checkSchemes()

if (errors.length > 0) {
  console.error('Fix what `npm run validate` reports first.')
  process.exit(1)
}

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const urlPath = (path) => path.split('/').map(encodeURIComponent).join('/')

// The date of the last commit, or today outside a repository
const lastModified = (() => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
})()

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
cpSync(join(ROOT, 'site'), OUT, { recursive: true })
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

// --- index.html --------------------------------------------------------------------------------

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      name: 'Xcasca Color Scheme Gallery',
      url: SITE_URL,
      description: 'A gallery of terminal color schemes for Xcasca, with previews and .xccolorscheme downloads.',
      inLanguage: 'en',
      author: { '@type': 'Person', name: 'jooy2', url: 'https://github.com/jooy2' },
    },
    {
      '@type': 'ItemList',
      name: 'Terminal color schemes for Xcasca',
      numberOfItems: list.length,
      itemListElement: list.map((scheme, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: scheme.name,
        url: `${SITE_URL}#${encodeURIComponent(scheme.name)}`,
      })),
    },
  ],
}

const staticList = list
  .map((scheme) => `<li><a class="static" href="#${encodeURIComponent(scheme.name)}">${escapeHtml(scheme.name)}</a></li>`)
  .join('')

const indexPath = join(OUT, 'index.html')
const index = readFileSync(indexPath, 'utf8')
  .replaceAll('%SCHEME_COUNT%', String(list.length))
  .replace(
    '<!-- structured-data -->',
    `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`,
  )
  .replace('<!-- scheme-list -->', staticList)

writeFileSync(indexPath, index)

// --- llms.txt ----------------------------------------------------------------------------------

const llms = [
  '# Xcasca Color Scheme Gallery',
  '',
  `> A collection of ${list.length} terminal color schemes for Xcasca, the SSH terminal for desktop and mobile. Each scheme is a \`.xccolorscheme\` file that Xcasca 1.1.2 or later imports on macOS, Windows, Linux, Android and iOS. The gallery previews every scheme on the same sample terminal session and links to its file. It is an unofficial project, unrelated to the company behind Xcasca.`,
  '',
  'A `.xccolorscheme` file is JSON with `app` ("xcasca"), `type` ("terminalColor"), `version` (1), `name`, and `data`, which holds 22 colors as `#RRGGBB`: foreground, background, selection (which may carry alpha as `#RRGGBBAA`), the eight ANSI colors, their eight bright variants, and three search highlight colors. To use one, download it, open Terminal Color Schemes in Xcasca, import the file, and choose the scheme in a session\'s Appearance settings.',
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
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${SITE_URL}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    '  </url>',
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
console.log(`Built _site/ with ${list.length} color schemes.`)
