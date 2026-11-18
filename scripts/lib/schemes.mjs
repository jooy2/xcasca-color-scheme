// Reading and checking the color scheme files. Every rule here mirrors what the Xcasca app does when
// it imports and exports a `.xccolorscheme` file, plus a few rules of this collection (marked so).

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
// Terminal color schemes; another kind of scheme the app may export later gets a folder of its own
export const SCHEMES_DIR = join(ROOT, 'schemes', 'terminal')
export const SCHEMES_PATH = 'schemes/terminal'
export const CREDITS_FILE = join(ROOT, 'credits.json')
export const EXTENSION = '.xccolorscheme'

export const ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
export const BRIGHT = ANSI.map((name) => `bright${name[0].toUpperCase()}${name.slice(1)}`)
// The order the app writes the colors in, which a file has to keep
export const COLOR_KEYS = [
  'foreground',
  'background',
  'selection',
  ...ANSI,
  ...BRIGHT,
  'searchHitBackground',
  'searchHitBackgroundCurrent',
  'searchHitForeground',
]
export const TOP_KEYS = ['app', 'type', 'version', 'name', 'data']
export const KINDS = ['built-in', 'community', 'original']

// What the app refuses in a name, since a scheme is exported under its name
const APP_INVALID_NAME = /[\\/:*?"<>|\u0000-\u001f\u007f]/
// This collection: printable ASCII only, so every file name works on every system and in every URL
const ASCII_NAME = /^[\x20-\x7e]+$/
const NAME_MAX = 64
const HEX6 = /^#[0-9A-Fa-f]{6}$/
const HEX6_OR_8 = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/
// Under the first, text is hard to read and a scheme is refused; under the second it gets a warning
const MIN_TEXT_CONTRAST = 3
const GOOD_TEXT_CONTRAST = 4.5

export const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrast = (a, b) => {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x)

  return (la + 0.05) / (lb + 0.05)
}

export const isDark = (data) => luminance(data.background) < 0.2

// The colors that make a scheme look the way it does; search hits keep the app's defaults
const paletteKey = (data) =>
  ['foreground', 'background', ...ANSI, ...BRIGHT].map((key) => data[key].slice(0, 7).toUpperCase()).join(' ')

const channelDistance = (a, b) =>
  Math.max(
    ...[1, 3, 5].map((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16))),
  )

const sameKeys = (actual, expected) =>
  actual.length === expected.length && actual.every((key, index) => key === expected[index])

/*
 * Every scheme file with what was found wrong in it. `errors` stop a pull request; `warnings` are
 * printed and let it through.
 */
export const checkSchemes = () => {
  const errors = []
  const warnings = []
  const schemes = []
  const error = (file, message) => errors.push({ file, message })
  const warning = (file, message) => warnings.push({ file, message })

  if (!existsSync(SCHEMES_DIR)) {
    error(SCHEMES_PATH, 'The schemes/terminal folder is missing.')

    return { errors, warnings, schemes }
  }

  // The names every file stands for, so a broken file is not also reported as missing from credits
  const fileNames = new Set()

  for (const fileName of readdirSync(SCHEMES_DIR).sort()) {
    const file = `${SCHEMES_PATH}/${fileName}`

    if (fileName.endsWith(EXTENSION)) {
      fileNames.add(fileName.slice(0, -EXTENSION.length))
    }

    if (fileName.startsWith('.')) {
      continue
    }

    if (!fileName.endsWith(EXTENSION)) {
      error(file, `Only ${EXTENSION} files belong in ${SCHEMES_PATH}/.`)
      continue
    }

    const bytes = readFileSync(join(SCHEMES_DIR, fileName))
    const text = bytes.toString('utf8')

    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      error(file, 'The file starts with a byte order mark. Save it as UTF-8 without one.')
      continue
    }

    if (!Buffer.from(text, 'utf8').equals(bytes)) {
      error(file, 'The file is not valid UTF-8.')
      continue
    }

    if (/[^\x20-\x7e\n]/.test(text)) {
      error(file, 'The file holds a character other than printable ASCII and line feeds (a tab, CR, or a non-ASCII letter).')
      continue
    }

    let scheme

    try {
      scheme = JSON.parse(text)
    } catch (e) {
      error(file, `The file is not valid JSON: ${e.message}`)
      continue
    }

    if (!scheme || typeof scheme !== 'object' || Array.isArray(scheme)) {
      error(file, 'The file must hold one JSON object.')
      continue
    }

    if (!sameKeys(Object.keys(scheme), TOP_KEYS)) {
      error(file, `The object must hold exactly ${TOP_KEYS.join(', ')}, in that order.`)
      continue
    }

    if (scheme.app !== 'xcasca' || scheme.type !== 'terminalColor' || scheme.version !== 1) {
      error(file, 'app, type and version must be "xcasca", "terminalColor" and 1.')
      continue
    }

    const { name, data } = scheme

    if (typeof name !== 'string' || !name || name !== name.trim()) {
      error(file, 'name must be a non-empty string with no space at either end.')
      continue
    }

    if (APP_INVALID_NAME.test(name)) {
      error(file, 'name holds a character the app refuses: \\ / : * ? " < > | or a control character.')
      continue
    }

    if (!ASCII_NAME.test(name)) {
      error(file, 'name must use printable ASCII only, so the file name works everywhere.')
      continue
    }

    if (name.length > NAME_MAX) {
      error(file, `name must be ${NAME_MAX} characters or fewer.`)
      continue
    }

    if (/[. ]$/.test(name)) {
      error(file, 'name cannot end with a dot or a space; the app drops them from the file name.')
      continue
    }

    if (fileName !== `${name}${EXTENSION}`) {
      error(file, `The file must be named "${name}${EXTENSION}", after the scheme, as the app exports it.`)
      continue
    }

    if (!data || typeof data !== 'object' || Array.isArray(data) || !sameKeys(Object.keys(data), COLOR_KEYS)) {
      error(file, `data must hold exactly these colors, in this order: ${COLOR_KEYS.join(', ')}.`)
      continue
    }

    const badColors = COLOR_KEYS.filter((key) => !(key === 'selection' ? HEX6_OR_8 : HEX6).test(data[key]))

    if (badColors.length > 0) {
      error(file, `Not a #RRGGBB color${badColors.includes('selection') ? ' (#RRGGBBAA for selection)' : ''}: ${badColors.join(', ')}.`)
      continue
    }

    // The app writes JSON indented by two spaces with a final line feed; anything else was not
    // exported by it
    if (text !== `${JSON.stringify(scheme, null, 2)}\n`) {
      error(file, 'The layout differs from what the app writes. Export the scheme from the app, or run `npm run format`.')
      continue
    }

    const ratio = contrast(data.foreground, data.background)

    if (ratio < MIN_TEXT_CONTRAST) {
      error(file, `Text is hard to read: the foreground and background contrast is ${ratio.toFixed(2)}:1, under ${MIN_TEXT_CONTRAST}:1.`)
    } else if (ratio < GOOD_TEXT_CONTRAST) {
      warning(file, `The foreground and background contrast is ${ratio.toFixed(2)}:1, under the ${GOOD_TEXT_CONTRAST}:1 that body text should have.`)
    }

    schemes.push({ file, fileName, name, data, dark: isDark(data) })
  }

  // Names and palettes that another scheme already has
  const byName = new Map()
  const byPalette = new Map()

  for (const scheme of schemes) {
    const nameKey = scheme.name.toLowerCase()
    const palette = paletteKey(scheme.data)

    if (byName.has(nameKey)) {
      error(scheme.file, `The name is already taken by ${byName.get(nameKey).file} (names are compared without case).`)
    } else {
      byName.set(nameKey, scheme)
    }

    if (byPalette.has(palette)) {
      error(scheme.file, `The colors are the same as in ${byPalette.get(palette).file}.`)
    } else {
      byPalette.set(palette, scheme)
    }
  }

  for (let i = 0; i < schemes.length; i++) {
    for (let j = i + 1; j < schemes.length; j++) {
      const a = schemes[i]
      const b = schemes[j]
      const keys = ['foreground', 'background', ...ANSI, ...BRIGHT]
      const furthest = Math.max(...keys.map((key) => channelDistance(a.data[key], b.data[key])))

      if (furthest > 0 && furthest <= 4) {
        error(b.file, `Practically the same colors as ${a.file}: no color differs by more than ${furthest} in any channel.`)
      } else if (furthest > 4 && furthest <= 12) {
        warning(b.file, `Very close to the colors of ${a.file}: no color differs by more than ${furthest} in any channel.`)
      }
    }
  }

  // Credits: every scheme has one, and nothing else does
  let credits = {}

  try {
    credits = JSON.parse(readFileSync(CREDITS_FILE, 'utf8'))
  } catch (e) {
    error('credits.json', `credits.json cannot be read: ${e.message}`)
  }

  for (const scheme of schemes) {
    const credit = credits[scheme.name]

    if (!credit) {
      error('credits.json', `"${scheme.name}" has no entry. Add who made it, where it comes from and its license.`)
      continue
    }

    if (!KINDS.includes(credit.kind)) {
      error('credits.json', `"${scheme.name}": kind must be one of ${KINDS.join(', ')}.`)
    }

    for (const field of ['author', 'url', 'license']) {
      if (typeof credit[field] !== 'string' || !credit[field].trim()) {
        error('credits.json', `"${scheme.name}": ${field} is missing.`)
      }
    }

    if (typeof credit.url === 'string' && !/^https:\/\//.test(credit.url)) {
      error('credits.json', `"${scheme.name}": url must start with https://.`)
    }

    scheme.credit = credit
  }

  for (const name of Object.keys(credits)) {
    if (!schemes.some((scheme) => scheme.name === name) && !fileNames.has(name)) {
      error('credits.json', `"${name}" has an entry but no file in ${SCHEMES_PATH}/.`)
    }
  }

  return { errors, warnings, schemes }
}

// The text the app writes for a scheme, used by `npm run format`
export const formatScheme = (scheme) => {
  const data = {}

  for (const key of COLOR_KEYS) {
    data[key] = scheme.data[key]
  }

  return `${JSON.stringify({ app: 'xcasca', type: 'terminalColor', version: 1, name: scheme.name, data }, null, 2)}\n`
}
