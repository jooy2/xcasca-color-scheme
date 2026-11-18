// Rewrites every scheme file in the layout the app exports: the same keys in the same order, two
// spaces of indent and a final line feed. For a file edited by hand; one exported from the app
// is already in this layout.
//
//   node scripts/format.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { COLOR_KEYS, EXTENSION, SCHEMES_DIR, SCHEMES_PATH, formatScheme } from './lib/schemes.mjs'

let changed = 0

for (const fileName of readdirSync(SCHEMES_DIR).filter((name) => name.endsWith(EXTENSION))) {
  const path = join(SCHEMES_DIR, fileName)
  const text = readFileSync(path, 'utf8')
  let scheme

  try {
    scheme = JSON.parse(text.replace(/^﻿/, ''))
  } catch (e) {
    console.log(`skipped  ${SCHEMES_PATH}/${fileName}: not valid JSON (${e.message})`)
    continue
  }

  const missing = COLOR_KEYS.filter((key) => typeof scheme?.data?.[key] !== 'string')

  if (typeof scheme?.name !== 'string' || missing.length > 0) {
    console.log(`skipped  ${SCHEMES_PATH}/${fileName}: no name or missing ${missing.join(', ')}`)
    continue
  }

  const formatted = formatScheme({ name: scheme.name.trim(), data: scheme.data })

  if (formatted !== text) {
    writeFileSync(path, formatted)
    changed++
    console.log(`formatted ${SCHEMES_PATH}/${fileName}`)
  }
}

console.log(changed ? `${changed} file${changed === 1 ? '' : 's'} rewritten.` : 'Every file is already in the app layout.')
