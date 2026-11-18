// The editor: start from a scheme in the gallery or from a file, change its colors on a live
// terminal, and download the result as a .xccolorscheme file in the exact layout Xcasca exports.

import {
  $,
  ANSI,
  BRIGHT,
  bindLanguages,
  bindTheme,
  colorName,
  copyText,
  createPreview,
  element,
  loadSchemes,
  saveFile,
  showToast,
  storage,
  t,
} from './common.js'
import { bindFormatMenu, fileBase } from './formats.js'

// The order Xcasca writes the colors in
const COLOR_KEYS = [
  'foreground',
  'background',
  'selection',
  ...ANSI,
  ...BRIGHT,
  'searchHitBackground',
  'searchHitBackgroundCurrent',
  'searchHitForeground',
]
const SEARCH_KEYS = ['searchHitBackground', 'searchHitBackgroundCurrent', 'searchHitForeground']
const SEARCH_DEFAULTS = { searchHitBackground: '#FFFF2B', searchHitBackgroundCurrent: '#31FF26', searchHitForeground: '#000000' }
// What the app refuses in a name, which is also the file's name
const INVALID_NAME = /[\\/:*?"<>|\u0000-\u001f\u007f]/
const DRAFT_KEY = 'xcasca-gallery-draft'
const HEX6 = /^#?[0-9a-f]{6}$/i

// colors holds #RRGGBB for every key; the selection's alpha is kept apart, as 0 to 100
const state = { name: '', colors: {}, opacity: 30, from: '' }
const inputs = {}
let schemes = []
let preview = null
let formats = null

const normalizeHex = (value) => `#${value.replace(/^#/, '').toUpperCase()}`

const splitSelection = (hex) => {
  const value = hex.replace(/^#/, '')
  const alpha = value.length === 8 ? parseInt(value.slice(6), 16) : 255

  return { color: `#${value.slice(0, 6).toUpperCase()}`, opacity: Math.round((alpha / 255) * 100) }
}

const alphaHex = (opacity) =>
  Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()

// The colors as the file holds them
const fileColors = () =>
  Object.fromEntries(
    COLOR_KEYS.map((key) => [key, key === 'selection' ? `${state.colors.selection}${alphaHex(state.opacity)}` : state.colors[key]]),
  )

const fileContent = () =>
  `${JSON.stringify({ app: 'xcasca', type: 'terminalColor', version: 1, name: state.name.trim(), data: fileColors() }, null, 2)}\n`

// --- loading a scheme --------------------------------------------------------------------------

const load = ({ name, data }) => {
  const { color, opacity } = splitSelection(data.selection)

  state.name = name
  state.opacity = opacity

  for (const key of COLOR_KEYS) {
    state.colors[key] = key === 'selection' ? color : normalizeHex(data[key] ?? SEARCH_DEFAULTS[key])
  }

  render()
}

/*
 * The scheme in a .xccolorscheme file, read as the app reads it, or null when the app would refuse
 * the file. A search highlight color the file lacks takes the app's own.
 */
const parseFile = (text) => {
  let file

  try {
    file = JSON.parse(text)
  } catch {
    return null
  }

  if (
    !file ||
    typeof file !== 'object' ||
    file.app !== 'xcasca' ||
    file.type !== 'terminalColor' ||
    !Number.isInteger(file.version) ||
    file.version !== 1 ||
    typeof file.name !== 'string' ||
    !file.name.replace(INVALID_NAME, '').trim() ||
    !file.data ||
    typeof file.data !== 'object'
  ) {
    return null
  }

  const data = {}

  for (const key of COLOR_KEYS) {
    const value = String(file.data[key] ?? '').trim()
    const valid = key === 'selection' ? /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) : HEX6.test(value)

    if (valid) {
      data[key] = `#${value.replace(/^#/, '')}`
    } else if (SEARCH_KEYS.includes(key)) {
      data[key] = SEARCH_DEFAULTS[key]
    } else {
      return null
    }
  }

  return { name: file.name.trim(), data }
}

// --- the form ----------------------------------------------------------------------------------

const colorField = (key, label, compact = false) => {
  const field = element('label', compact ? 'color-field compact' : 'color-field')
  const picker = element('input')
  const hex = element('input', 'hex')

  picker.type = 'color'
  picker.setAttribute('aria-label', label)
  hex.type = 'text'
  hex.maxLength = 7
  hex.spellcheck = false
  hex.setAttribute('aria-label', `${label} hex`)

  picker.addEventListener('input', () => {
    state.colors[key] = picker.value.toUpperCase()
    hex.value = state.colors[key]
    changed()
  })
  hex.addEventListener('input', () => {
    if (HEX6.test(hex.value.trim())) {
      state.colors[key] = normalizeHex(hex.value.trim())
      picker.value = state.colors[key].toLowerCase()
      hex.classList.remove('invalid')
      changed()
    } else {
      hex.classList.add('invalid')
    }
  })
  hex.addEventListener('blur', () => {
    hex.value = state.colors[key]
    hex.classList.remove('invalid')
  })

  inputs[key] = { picker, hex }

  if (compact) {
    field.append(picker, hex)
  } else {
    field.append(picker, element('span', 'color-label', label), hex)
  }

  return field
}

const buildForm = () => {
  $('base-fields').replaceChildren(
    ...['foreground', 'background', 'selection'].map((key) => colorField(key, t(`palette.${key}`))),
  )

  // One row per color, normal and bright side by side, so every hex value fits
  const grid = element('div', 'ansi-grid')

  grid.append(element('span'), element('span', 'grid-head', t('palette.normal')), element('span', 'grid-head', t('palette.bright')))

  ANSI.forEach((key, index) => {
    grid.append(
      element('span', 'grid-row', colorName(key)),
      colorField(key, colorName(key), true),
      colorField(BRIGHT[index], colorName(BRIGHT[index]), true),
    )
  })

  $('ansi-fields').replaceChildren(grid)
  $('search-fields').replaceChildren(...SEARCH_KEYS.map((key) => colorField(key, t(`editor.${key}`))))

  $('name').addEventListener('input', (event) => {
    state.name = event.target.value
    changed()
  })
  $('opacity').addEventListener('input', (event) => {
    state.opacity = Number(event.target.value)
    changed()
  })
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)

  return (high + 0.05) / (low + 0.05)
}

// Why the name cannot be used, or a note about it, as the app and the gallery judge it
const checkName = () => {
  const name = state.name.trim()

  if (!name) {
    return { error: t('editor.nameRequired') }
  }

  if (name.length > 255) {
    return { error: t('editor.nameTooLong') }
  }

  if (INVALID_NAME.test(name)) {
    return { error: t('editor.nameInvalid') }
  }

  if (schemes.some((scheme) => scheme.name.toLowerCase() === name.toLowerCase())) {
    return { note: t('editor.nameTaken') }
  }

  if (!/^[\x20-\x7e]+$/.test(name) || name.length > 64) {
    return { note: t('editor.nameGallery') }
  }

  return {}
}

const render = () => {
  $('name').value = state.name
  $('opacity').value = String(state.opacity)

  for (const key of COLOR_KEYS) {
    inputs[key].picker.value = state.colors[key].toLowerCase()
    inputs[key].hex.value = state.colors[key]
    inputs[key].hex.classList.remove('invalid')
  }

  changed({ save: false })
}

let frame = 0

// Everything that follows a change: the preview, the checks, and the draft kept for next time
const changed = ({ save = true } = {}) => {
  $('opacity-value').value = `${state.opacity}%`

  const { error, note } = checkName()
  const message = $('name-message')

  message.textContent = error ?? note ?? ''
  message.classList.toggle('error', Boolean(error))
  $('name').setAttribute('aria-invalid', String(Boolean(error)))
  $('download-scheme').disabled = Boolean(error)
  $('copy-json').disabled = Boolean(error)
  formats?.setEnabled(!error)

  const ratio = contrast(state.colors.foreground, state.colors.background)
  const rating = ratio >= 7 ? 'great' : ratio >= 4.5 ? 'good' : ratio >= 3 ? 'low' : 'bad'
  const line = $('contrast')

  line.textContent = `${t('editor.contrast', { ratio: ratio.toFixed(1) })} · ${t(`editor.contrast.${rating}`)}`
  line.dataset.rating = rating

  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => preview?.setColors(fileColors()))

  if (save) {
    storage.set(DRAFT_KEY, JSON.stringify({ name: state.name, data: fileColors(), from: state.from }))
  }
}

// --- actions -----------------------------------------------------------------------------------

const download = () => saveFile(`${fileBase(state.name)}.xccolorscheme`, fileContent(), 'application/json')

const startFrom = (name) => {
  const scheme = schemes.find((x) => x.name === name)

  if (scheme) {
    state.from = scheme.name
    $('start-from').value = scheme.name
    load({ name: t('editor.copyName', { name: scheme.name }), data: scheme.colors })
    changed()
  }
}

const bindActions = () => {
  $('start-from').addEventListener('change', (event) => startFrom(event.target.value))
  $('reset').addEventListener('click', () => startFrom(state.from || 'Harbor Night'))
  $('download-scheme').addEventListener('click', download)
  $('copy-json').addEventListener('click', () => copyText(fileContent(), t('editor.copied')))
  formats = bindFormatMenu($('formats'), () => ({ name: state.name.trim(), colors: fileColors() }))

  $('import-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    const scheme = parseFile(await file.text())

    if (!scheme) {
      showToast(t('editor.importError'))
      return
    }

    state.from = ''
    $('start-from').value = ''
    load(scheme)
    changed()
    showToast(t('editor.imported', { name: scheme.name }))
  })

  // The label that opens the file picker answers Enter and Space like a button
  document.querySelector('label[for="import-file"]').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      $('import-file').click()
    }
  })
}

const main = async () => {
  bindTheme()
  bindLanguages()
  buildForm()
  bindActions()

  schemes = (await loadSchemes()).terminal

  const select = $('start-from')

  select.replaceChildren(
    element('option', '', '—'),
    ...schemes.map((scheme) => {
      const option = element('option', '', scheme.name)

      option.value = scheme.name

      return option
    }),
  )
  select.firstElementChild.value = ''
  preview = await createPreview($('frame'))

  // A scheme named in the address wins over the draft; the draft over the default
  const fromHash = decodeURIComponent(location.hash.slice(1))
  const draft = (() => {
    try {
      return JSON.parse(storage.get(DRAFT_KEY) ?? 'null')
    } catch {
      return null
    }
  })()

  if (schemes.some((scheme) => scheme.name === fromHash)) {
    startFrom(fromHash)
    history.replaceState(null, '', location.pathname)
  } else if (draft?.data && parseFile(JSON.stringify({ app: 'xcasca', type: 'terminalColor', version: 1, name: draft.name || 'Draft', data: draft.data }))) {
    state.from = draft.from ?? ''
    select.value = state.from
    load({ name: draft.name ?? '', data: draft.data })
  } else {
    startFrom('Harbor Night')
  }

  await preview.showSample('shell')
}

main()
