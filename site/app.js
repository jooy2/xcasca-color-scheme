// The gallery: a list of schemes on the left, and the selected one drawn on a terminal with xterm.js.

const REPO = 'https://github.com/jooy2/xcasca-color-scheme'
const COLS = 68
const ROWS = 25
const prompt = (path) => `\x1b[1;32mdemo@devbox\x1b[0m:\x1b[1;34m${path}\x1b[0m$ `
/*
 * The sessions the terminal can show, written by scripts/sample.mjs. Each ends on a prompt, and
 * has a stretch of text selected so the selection color shows.
 */
const SAMPLES = {
  shell: { path: '~/projects/aurora', selection: { column: 8, row: 10, length: 30 } },
  code: { path: '~/projects/aurora', selection: { column: 6, row: 13, length: 33 } },
  colors: { path: '~', selection: { column: 9, row: 1, length: 15 } },
  cjk: { path: '~/文書', selection: { column: 5, row: 11, length: 26 } },
}
const FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
const BRIGHT = ANSI.map((name) => `bright${name[0].toUpperCase()}${name.slice(1)}`)
const KIND_LABEL = { 'built-in': 'Built-in', community: 'Community', original: 'Original' }

const state = { schemes: [], visible: [], current: null, mode: 'all', kind: 'all', query: '', sample: 'shell' }
const sampleTexts = {}
const $ = (id) => document.getElementById(id)
// An icon the build put in a <template>, for elements made here
const icon = (name) => $(`icon-${name}`).content.firstElementChild.cloneNode(true)
let terminal = null

const toTheme = (c) => ({
  foreground: c.foreground,
  background: c.background,
  cursor: c.foreground,
  cursorAccent: c.background,
  selectionBackground: c.selection,
  selectionInactiveBackground: c.selection,
  ...Object.fromEntries(ANSI.map((key) => [key, c[key]])),
  ...Object.fromEntries(BRIGHT.map((key) => [key, c[key]])),
})

const fontSizeFor = (width) => {
  // JetBrains Mono is 0.6 em wide; leave the frame's padding
  const size = Math.floor(((width - 36) / (COLS * 0.6)) * 2) / 2

  return Math.max(8, Math.min(15, size))
}

const showToast = (text) => {
  const toast = $('toast')

  toast.textContent = text
  toast.hidden = false
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => {
    toast.hidden = true
  }, 1600)
}

// A scheme changes only the colors; what the terminal shows stays
const applyTheme = () => {
  if (terminal && state.current) {
    terminal.options.theme = toTheme(state.current.colors)
  }
}

const loadSample = async (name) => {
  sampleTexts[name] ??= await fetch(`samples/${name}.ansi`).then((response) => response.text())

  return sampleTexts[name]
}

const writeSample = async () => {
  const name = state.sample
  const text = await loadSample(name)
  const { path, selection } = SAMPLES[name]

  if (!terminal || name !== state.sample) {
    return
  }

  terminal.reset()
  typed = ''
  terminal.write(`${text}${prompt(path)}`, () => {
    terminal.select(selection.column, selection.row, selection.length)
  })
}

/*
 * Typing in the terminal. Nothing runs behind it, so what is typed is shown on the line, Enter
 * starts a new prompt, and `clear` or Ctrl+L clears the screen.
 */
let typed = ''

const isWide = (char) => {
  const code = char.codePointAt(0)

  return (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6)
  )
}

const currentPrompt = () => prompt(SAMPLES[state.sample].path)

const onInput = (data) => {
  if (data === '\r') {
    terminal.write(typed.trim() === 'clear' ? `\x1b[2J\x1b[3J\x1b[H${currentPrompt()}` : `\r\n${currentPrompt()}`)
    typed = ''
  } else if (data === '\x7f' || data === '\b') {
    const chars = [...typed]
    const last = chars.pop()

    if (last) {
      const width = isWide(last) ? 2 : 1

      typed = chars.join('')
      terminal.write(`${'\b'.repeat(width)}${' '.repeat(width)}${'\b'.repeat(width)}`)
    }
  } else if (data === '\x03') {
    terminal.write(`^C\r\n${currentPrompt()}`)
    typed = ''
  } else if (data === '\x0c') {
    terminal.write(`\x1b[2J\x1b[3J\x1b[H${currentPrompt()}${typed}`)
  } else if (!data.startsWith('\x1b')) {
    // Printable text only, from a key or a paste; a pasted line break ends nothing
    const text = [...data].filter((char) => char >= ' ' && char !== '\x7f').join('')

    typed += text
    terminal.write(text)
  }
}

const bindSamples = () => {
  const buttons = [...document.querySelectorAll('[data-sample]')]

  for (const button of buttons) {
    button.addEventListener('click', () => {
      state.sample = button.dataset.sample

      for (const other of buttons) {
        other.setAttribute('aria-pressed', String(other === button))
      }

      writeSample()
    })
  }
}

const copyHex = async (hex) => {
  try {
    await navigator.clipboard.writeText(hex)
    showToast(`Copied ${hex}`)
  } catch {
    showToast(hex)
  }
}

const element = (tag, className, text) => {
  const node = document.createElement(tag)

  if (className) {
    node.className = className
  }

  if (text !== undefined) {
    node.textContent = text
  }

  return node
}

// A button that shows a color and copies its hex value
const swatch = (hex, label, className) => {
  const button = element('button', className)
  const color = element('span', 'swatch-color')

  button.type = 'button'
  button.title = `${label}: ${hex}`
  button.setAttribute('aria-label', `${label} ${hex}`)
  color.style.background = hex
  button.append(color)
  button.addEventListener('click', () => copyHex(hex))

  return button
}

/*
 * Foreground, background and selection in a row, then the sixteen ANSI colors as a table: the
 * color names across, normal and bright down, so every cell has the same size.
 */
const renderPalette = (colors) => {
  const base = element('div', 'palette-base')

  for (const [key, label] of [['foreground', 'Foreground'], ['background', 'Background'], ['selection', 'Selection']]) {
    const button = swatch(colors[key], label, 'base-swatch')
    const text = element('span', 'base-text')

    text.append(element('small', '', label), element('code', '', colors[key]))
    button.append(text)
    base.append(button)
  }

  const grid = element('div', 'palette-grid')

  grid.append(element('span', 'grid-corner'))

  for (const key of ANSI) {
    grid.append(element('span', 'grid-head', key[0].toUpperCase() + key.slice(1)))
  }

  for (const [row, keys] of [['Normal', ANSI], ['Bright', BRIGHT]]) {
    grid.append(element('span', 'grid-row', row))

    for (const key of keys) {
      const label = row === 'Bright' ? `Bright ${key.slice(6).toLowerCase()}` : key
      const button = swatch(colors[key], label, 'grid-swatch')

      button.append(element('code', '', colors[key].toUpperCase()))
      grid.append(button)
    }
  }

  $('palette').replaceChildren(base, grid)
}

const renderViewer = () => {
  const scheme = state.current
  const { colors } = scheme
  const frame = $('frame')

  document.title = `${scheme.name} · Xcasca Color Scheme Gallery`
  $('scheme-name').textContent = scheme.name
  $('scheme-credit').innerHTML = ''

  const credit = $('scheme-credit')
  const link = document.createElement('a')

  link.href = scheme.url
  link.textContent = scheme.author
  link.rel = 'noopener'
  credit.append(`${KIND_LABEL[scheme.kind]} · ${scheme.dark ? 'Dark' : 'Light'} · by `, link, ` · ${scheme.license}`)

  const fileName = scheme.file.split('/').pop()
  const download = $('download')

  download.href = scheme.file.split('/').map(encodeURIComponent).join('/')
  download.setAttribute('download', fileName)
  $('source').href = `${REPO}/blob/main/${scheme.file.split('/').map(encodeURIComponent).join('/')}`

  frame.style.setProperty('--scheme-bg', colors.background)
  frame.style.setProperty('--scheme-fg', colors.foreground)

  renderPalette(colors)
  applyTheme()
}

const select = (scheme, { updateHash = true } = {}) => {
  state.current = scheme

  for (const button of $('list').querySelectorAll('button')) {
    button.setAttribute('aria-current', String(button.dataset.name === scheme.name))
  }

  if (updateHash) {
    history.replaceState(null, '', `#${encodeURIComponent(scheme.name)}`)
  }

  renderViewer()
}

const renderList = () => {
  const query = state.query.trim().toLowerCase()

  state.visible = state.schemes.filter(
    (scheme) =>
      (state.mode === 'all' || (state.mode === 'dark') === scheme.dark) &&
      (state.kind === 'all' || state.kind === scheme.kind) &&
      (!query || scheme.name.toLowerCase().includes(query) || scheme.author.toLowerCase().includes(query)),
  )

  const list = $('list')

  $('count').textContent = `${state.visible.length} of ${state.schemes.length} schemes`

  if (state.visible.length === 0) {
    const empty = document.createElement('li')

    empty.className = 'empty'
    empty.textContent = 'No scheme matches.'
    list.replaceChildren(empty)
    return
  }

  list.replaceChildren(
    ...state.visible.map((scheme) => {
      const item = document.createElement('li')
      const button = document.createElement('button')
      const mini = document.createElement('span')
      const name = document.createElement('span')
      const tag = document.createElement('span')

      button.type = 'button'
      button.dataset.name = scheme.name
      button.setAttribute('aria-current', String(scheme === state.current))
      mini.className = 'mini'
      mini.style.background = scheme.colors.background

      for (const key of [...ANSI, ...BRIGHT]) {
        const cell = document.createElement('i')

        cell.style.background = scheme.colors[key]
        mini.append(cell)
      }

      name.className = 'name'
      name.textContent = scheme.name
      tag.className = 'tag'
      tag.title = scheme.dark ? 'Dark' : 'Light'
      tag.append(icon(scheme.dark ? 'moon' : 'sun'))
      button.append(mini, name, tag)
      button.addEventListener('click', () => select(scheme))
      item.append(button)

      return item
    }),
  )
}

const bindFilters = () => {
  for (const button of document.querySelectorAll('[data-mode], [data-kind]')) {
    button.addEventListener('click', () => {
      const field = button.dataset.mode ? 'mode' : 'kind'

      state[field] = button.dataset[field]

      for (const other of document.querySelectorAll(`[data-${field}]`)) {
        other.setAttribute('aria-pressed', String(other === button))
      }

      renderList()
    })
  }

  $('search').addEventListener('input', (event) => {
    state.query = event.target.value
    renderList()
  })

  // Up and down move through the list
  $('list').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()

    const index = state.visible.indexOf(state.current)
    const next = state.visible[Math.min(state.visible.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)))]

    if (next) {
      select(next)
      $('list').querySelector(`button[data-name="${CSS.escape(next.name)}"]`)?.focus()
    }
  })
}

const bindTabs = () => {
  const tabs = [...document.querySelectorAll('[role="tab"]')]

  const activate = (tab) => {
    for (const other of tabs) {
      const selected = other === tab

      other.setAttribute('aria-selected', String(selected))
      other.tabIndex = selected ? 0 : -1
      $(other.getAttribute('aria-controls')).hidden = !selected
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab))
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]

        activate(next)
        next.focus()
      }
    })
  })
}

const createTerminal = () => {
  const host = $('terminal')

  terminal = new Terminal({
    cols: COLS,
    rows: ROWS,
    convertEol: true,
    cursorBlink: true,
    cursorStyle: 'block',
    cursorInactiveStyle: 'block',
    fontFamily: FONT,
    fontSize: fontSizeFor(host.clientWidth),
    lineHeight: 1.15,
    scrollback: 0,
  })
  terminal.open(host)
  terminal.onData(onInput)

  new ResizeObserver(() => {
    const size = fontSizeFor(host.clientWidth)

    if (size !== terminal.options.fontSize) {
      terminal.options.fontSize = size
    }
  }).observe(host)
}

const main = async () => {
  bindFilters()
  bindTabs()
  bindSamples()

  const [index] = await Promise.all([fetch('schemes.json').then((response) => response.json()), loadSample('shell')])

  state.schemes = index.terminal

  // The terminal measures its font when it opens, so the font has to be there first
  await Promise.all([document.fonts.load(`15px ${FONT}`), document.fonts.load(`bold 15px ${FONT}`)]).catch(() => {})
  createTerminal()

  const fromHash = decodeURIComponent(location.hash.slice(1))
  const first =
    state.schemes.find((scheme) => scheme.name === fromHash) ??
    state.schemes.find((scheme) => scheme.name === 'Harbor Night') ??
    state.schemes[0]

  state.current = first
  renderList()
  select(first, { updateHash: false })
  await writeSample()
  // Bring the selected scheme into view inside the list, without moving the page
  const list = $('list')
  const current = list.querySelector('button[aria-current="true"]')

  if (current) {
    list.scrollTop = current.offsetTop - list.clientHeight / 2
  }

  window.addEventListener('hashchange', () => {
    const scheme = state.schemes.find((x) => x.name === decodeURIComponent(location.hash.slice(1)))

    if (scheme && scheme !== state.current) {
      select(scheme, { updateHash: false })
    }
  })
}

main().catch((error) => {
  $('scheme-name').textContent = 'The gallery could not load.'
  $('scheme-credit').textContent = String(error)
})
