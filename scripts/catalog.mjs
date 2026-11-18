// Writes the list of color schemes in README.md and the small preview image of each scheme in
// docs/swatches/terminal/. Run it after adding or changing a scheme.
//
//   node scripts/catalog.mjs           updates README.md and the images
//   node scripts/catalog.mjs --check   only reports whether they are up to date (used in CI)

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ANSI, BRIGHT, ROOT, SCHEMES_PATH, checkSchemes } from './lib/schemes.mjs'

const CHECK = process.argv.includes('--check')
const README = join(ROOT, 'README.md')
const SWATCH_DIR = join(ROOT, 'docs', 'swatches', 'terminal')
const SWATCH_PATH = 'docs/swatches/terminal'
const START = '<!-- catalog:start -->'
const END = '<!-- catalog:end -->'

const GROUPS = [
  ['built-in', 'Built into Xcasca', 'The schemes the app ships with, as the app exports them.'],
  ['community', 'Community favorites', 'Well-known schemes, under their original names and licenses.'],
  ['original', 'Originals', 'Made for this collection.'],
]

const { errors, schemes } = checkSchemes()

if (errors.length > 0) {
  console.error('Fix what `npm run validate` reports first.')
  process.exit(1)
}

const url = (path) => path.split('/').map(encodeURIComponent).join('/')

const swatch = ({ name, data }) => {
  const cell = (color, index, row) =>
    `  <rect x="${72 + index * 25}" y="${row ? 30 : 12}" width="21" height="14" rx="3" fill="${color.slice(0, 7)}"/>`
  const cells = [...ANSI.map((key, i) => cell(data[key], i, 0)), ...BRIGHT.map((key, i) => cell(data[key], i, 1))]

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="56" viewBox="0 0 280 56" role="img" aria-label="${name}">`,
    `  <rect width="280" height="56" rx="8" fill="${data.background}"/>`,
    `  <text x="16" y="34" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="16" fill="${data.foreground}">~$</text>`,
    ...cells,
    '</svg>',
    '',
  ].join('\n')
}

const catalog = () => {
  const lines = [START, '']

  for (const [kind, title, description] of GROUPS) {
    const group = schemes.filter((scheme) => scheme.credit.kind === kind).sort((a, b) => a.name.localeCompare(b.name))

    if (group.length === 0) {
      continue
    }

    lines.push(`### ${title}`, '', description, '', '| Preview | Scheme | Mode | Made by | License |', '|---|---|---|---|---|')

    for (const scheme of group) {
      const { author, url: home, license } = scheme.credit

      lines.push(
        `| <img src="${url(`${SWATCH_PATH}/${scheme.name}.svg`)}" width="210" alt="${scheme.name}"> | [${scheme.name}](${url(`${SCHEMES_PATH}/${scheme.fileName}`)}) | ${scheme.dark ? 'Dark' : 'Light'} | [${author}](${home}) | ${license} |`,
      )
    }

    lines.push('')
  }

  lines.push(END)

  return lines.join('\n')
}

const stale = []
const readme = readFileSync(README, 'utf8')
const start = readme.indexOf(START)
const end = readme.indexOf(END)

if (start < 0 || end < start) {
  console.error(`README.md needs the ${START} and ${END} markers.`)
  process.exit(1)
}

const nextReadme = `${readme.slice(0, start)}${catalog()}${readme.slice(end + END.length)}`

if (nextReadme !== readme) {
  stale.push('README.md')
}

const wanted = new Map(schemes.map((scheme) => [`${scheme.name}.svg`, swatch(scheme)]))
const present = existsSync(SWATCH_DIR) ? readdirSync(SWATCH_DIR).filter((name) => name.endsWith('.svg')) : []

for (const [fileName, content] of wanted) {
  const path = join(SWATCH_DIR, fileName)

  if (!existsSync(path) || readFileSync(path, 'utf8') !== content) {
    stale.push(`${SWATCH_PATH}/${fileName}`)
  }
}

const extra = present.filter((fileName) => !wanted.has(fileName))

stale.push(...extra.map((fileName) => `${SWATCH_PATH}/${fileName}`))

if (CHECK) {
  if (stale.length > 0) {
    console.error(`Out of date: ${stale.join(', ')}.\nRun \`npm run catalog\` and commit the result.`)
    process.exit(1)
  }

  console.log('The README list and the preview images are up to date.')
  process.exit(0)
}

mkdirSync(SWATCH_DIR, { recursive: true })

for (const [fileName, content] of wanted) {
  writeFileSync(join(SWATCH_DIR, fileName), content)
}

for (const fileName of extra) {
  rmSync(join(SWATCH_DIR, fileName))
}

writeFileSync(README, nextReadme)
console.log(stale.length ? `Updated ${stale.length} file${stale.length === 1 ? '' : 's'}.` : 'Nothing to update.')
