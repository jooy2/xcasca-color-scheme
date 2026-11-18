// Builds the gallery into _site/, the folder GitHub Pages publishes: the page, the sample session,
// the screenshots, every scheme file, and schemes.json, which lists them for the page.
//
//   node scripts/build-site.mjs

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SCHEMES_DIR, SCHEMES_PATH, checkSchemes } from './lib/schemes.mjs'

const OUT = join(ROOT, '_site')
const { errors, schemes } = checkSchemes()

if (errors.length > 0) {
  console.error('Fix what `npm run validate` reports first.')
  process.exit(1)
}

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
// Served as files, not run through Jekyll
writeFileSync(join(OUT, '.nojekyll'), '')
console.log(`Built _site/ with ${list.length} color schemes.`)
