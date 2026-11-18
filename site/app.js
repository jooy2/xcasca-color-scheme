// The gallery: a list of schemes on the left, and the selected one drawn on a terminal with xterm.js.

const REPO = 'https://github.com/jooy2/xcasca-color-scheme'
const COLS = 68
const ROWS = 25
const PROMPT = '\x1b[1;32mdemo@devbox\x1b[0m:\x1b[1;34m~/projects/aurora\x1b[0m$ '
// The line of the sample shown selected, so the selection color shows: "Cache session tokens in memory"
const SELECTION = { column: 8, row: 10, length: 30 }
const FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
const BRIGHT = ANSI.map((name) => `bright${name[0].toUpperCase()}${name.slice(1)}`)
const KIND_LABEL = { 'built-in': 'Built-in', community: 'Community', original: 'Original' }

const state = { schemes: [], visible: [], current: null, mode: 'all', kind: 'all', query: '', sample: '' }
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

const drawTerminal = () => {
  const scheme = state.current

  if (!terminal || !scheme) {
    return
  }

  terminal.options.theme = toTheme(scheme.colors)
  terminal.reset()
  terminal.write(`${state.sample}${PROMPT}`, () => {
    terminal.select(SELECTION.column, SELECTION.row, SELECTION.length)
  })
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

  const palette = $('palette')
  const entries = [
    ['Foreground', colors.foreground],
    ['Background', colors.background],
    ['Selection', colors.selection],
    ...ANSI.map((key) => [key[0].toUpperCase() + key.slice(1), colors[key]]),
    ...BRIGHT.map((key) => [`Bright ${key.slice(6).toLowerCase()}`, colors[key]]),
  ]

  palette.replaceChildren(
    ...entries.map(([label, hex]) => {
      const item = document.createElement('li')
      const button = document.createElement('button')
      const dot = document.createElement('span')
      const text = document.createElement('span')
      const small = document.createElement('small')
      const code = document.createElement('code')

      button.type = 'button'
      button.title = `Copy ${hex}`
      dot.className = 'dot'
      dot.style.background = hex
      small.textContent = label
      code.textContent = hex
      text.append(small, code)
      button.append(dot, text)
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(hex)
          showToast(`Copied ${hex}`)
        } catch {
          showToast(hex)
        }
      })
      item.append(button)

      return item
    }),
  )

  drawTerminal()
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
    disableStdin: true,
    cursorBlink: false,
    cursorStyle: 'block',
    cursorInactiveStyle: 'block',
    fontFamily: FONT,
    fontSize: fontSizeFor(host.clientWidth),
    lineHeight: 1.15,
    scrollback: 0,
  })
  terminal.open(host)

  new ResizeObserver(() => {
    const size = fontSizeFor(host.clientWidth)

    if (size !== terminal.options.fontSize) {
      terminal.options.fontSize = size
      drawTerminal()
    }
  }).observe(host)
}

const main = async () => {
  bindFilters()
  bindTabs()

  const [index, sample] = await Promise.all([
    fetch('schemes.json').then((response) => response.json()),
    fetch('sample.ansi').then((response) => response.text()),
  ])

  state.schemes = index.terminal
  state.sample = sample

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
