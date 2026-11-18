// What the gallery and the editor share: the page's language and paths, the theme and language
// switches, and the terminal preview drawn with xterm.js.

import { isWide, run } from './shell.js'

export const $ = (id) => document.getElementById(id)

// The page's language: its strings, and the other languages to offer, written by the build
export const I18N = JSON.parse($('i18n').textContent)
// From this page to the site's root, such as ../ on /ko/
export const ROOT = document.documentElement.dataset.root ?? ''
export const REPO = 'https://github.com/jooy2/xcasca-color-scheme'

export const ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
export const BRIGHT = ANSI.map((name) => `bright${name[0].toUpperCase()}${name.slice(1)}`)

export const t = (key, values = {}) =>
  (I18N.strings[key] ?? key).replace(/\{(\w+)\}/g, (match, name) => (name in values ? values[name] : match))

export const colorName = (key) =>
  key.startsWith('bright')
    ? t('palette.brightColor', { color: t(`color.${key.slice(6).toLowerCase()}`) })
    : t(`color.${key}`)

// An icon the build put in a <template>, for elements made in script
export const icon = (name) => $(`icon-${name}`).content.firstElementChild.cloneNode(true)

export const element = (tag, className, text) => {
  const node = document.createElement(tag)

  if (className) {
    node.className = className
  }

  if (text !== undefined) {
    node.textContent = text
  }

  return node
}

export const showToast = (text) => {
  const toast = $('toast')

  toast.textContent = text
  toast.hidden = false
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => {
    toast.hidden = true
  }, 1600)
}

export const copyText = async (text, message) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(message)
  } catch {
    showToast(text.length < 40 ? text : message)
  }
}

// Hand the visitor a file made on the page
export const saveFile = (name, content, type) => {
  const link = element('a')

  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// localStorage, which a private window or blocked site data may refuse
export const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Not remembered, which changes nothing else
    }
  },
}

export const loadSchemes = () => fetch(`${ROOT}schemes.json`).then((response) => response.json())

// --- theme -------------------------------------------------------------------------------------

// Light, dark, or the system's, which is the default
const THEME_KEY = 'xcasca-gallery-theme'

export const bindTheme = () => {
  const buttons = [...document.querySelectorAll('[data-theme-choice]')]
  const apply = (choice) => {
    if (choice === 'light' || choice === 'dark') {
      document.documentElement.dataset.theme = choice
    } else {
      delete document.documentElement.dataset.theme
    }

    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice))
    }
  }

  apply(storage.get(THEME_KEY) ?? 'system')

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const choice = button.dataset.themeChoice

      storage.set(THEME_KEY, choice)
      apply(choice)
    })
  }
}

// --- languages ---------------------------------------------------------------------------------

/*
 * The language menu remembers the choice and keeps the address's hash. On an English page, a
 * visitor whose browser asks for another language the gallery has is offered it, once; the page is
 * never switched for them, so search engines and links always get the language they asked for.
 */
const LANGUAGE_KEY = 'xcasca-gallery-language'

const languageFor = (tag) => {
  const lower = tag.toLowerCase()

  if (lower.startsWith('ko')) return 'ko'
  if (lower.startsWith('ja')) return 'ja'
  if (/^zh-(tw|hk|mo|hant)/.test(lower)) return 'zh-Hant'
  if (lower.startsWith('zh')) return 'zh-Hans'
  if (lower.startsWith('en')) return 'en'

  return null
}

export const bindLanguages = () => {
  const menu = document.querySelector('.lang-menu')

  for (const link of document.querySelectorAll('[data-lang-link]')) {
    link.addEventListener('click', () => {
      storage.set(LANGUAGE_KEY, link.dataset.langLink)
      link.href = `${link.getAttribute('href')}${location.hash}`
    })
  }

  document.addEventListener('click', (event) => {
    if (menu?.open && !menu.contains(event.target)) {
      menu.open = false
    }
  })

  const offers = I18N.suggestions ?? {}

  if (storage.get(LANGUAGE_KEY) || Object.keys(offers).length === 0) {
    return
  }

  const wanted = (navigator.languages ?? [navigator.language]).map(languageFor).find(Boolean)
  const offer = offers[wanted]

  if (!offer) {
    return
  }

  const banner = $('language-suggestion')
  const link = $('language-suggestion-link')

  $('language-suggestion-text').textContent = offer.text
  link.textContent = offer.action
  link.href = offer.href || './'
  link.addEventListener('click', () => {
    storage.set(LANGUAGE_KEY, wanted)
    link.href = `${link.getAttribute('href')}${location.hash}`
  })
  $('language-suggestion-close').addEventListener('click', () => {
    storage.set(LANGUAGE_KEY, 'en')
    banner.hidden = true
  })
  banner.hidden = false
}

// --- terminal preview --------------------------------------------------------------------------

const COLS = 68
const ROWS = 25
export const FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
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
const sampleTexts = {}

const loadSample = async (name) => {
  sampleTexts[name] ??= await fetch(`${ROOT}samples/${name}.ansi`).then((response) => response.text())

  return sampleTexts[name]
}

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

/*
 * A terminal in `frame` that shows a sample session in a scheme's colors. The tabs in the frame
 * pick the session, and a visitor can type in it: nothing runs behind it, but `ls` and `pwd` answer
 * from the sample's directory, `clear` or Ctrl+L clears the screen, and anything else gets the
 * answer bash gives a missing program.
 */
export const createPreview = async (frame) => {
  const host = frame.querySelector('.terminal')
  const buttons = [...frame.querySelectorAll('[data-sample]')]
  let sample = 'shell'
  let typed = ''

  // The terminal measures its font when it opens, so the font has to be there first
  await Promise.all([document.fonts.load(`15px ${FONT}`), document.fonts.load(`bold 15px ${FONT}`)]).catch(() => {})

  // A cell's size in em, measured once the terminal is drawn; JetBrains Mono is 0.6 em wide
  const cell = { width: 0.6, height: 1.52 }
  const isFullscreen = () => frame.classList.contains('is-fullscreen')

  // The largest font that fits the whole screen in the frame: its width, and its height in full screen
  const fontSize = () => {
    const style = getComputedStyle(host)
    const width = host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 2
    let size = width / (COLS * cell.width)

    if (isFullscreen()) {
      const height = host.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 2

      size = Math.min(size, height / (ROWS * cell.height))
    }

    return Math.max(8, Math.min(isFullscreen() ? 32 : 15, Math.floor(size * 2) / 2))
  }

  const terminal = new Terminal({
    cols: COLS,
    rows: ROWS,
    convertEol: true,
    cursorBlink: true,
    cursorStyle: 'block',
    cursorInactiveStyle: 'block',
    fontFamily: FONT,
    fontSize: fontSize(),
    lineHeight: 1.15,
    scrollback: 0,
  })
  const currentPrompt = () => prompt(SAMPLES[sample].path)

  terminal.open(host)
  terminal.onData((data) => {
    if (data === '\r') {
      const line = typed.trim()

      typed = ''

      if (line === 'clear') {
        terminal.write(`\x1b[2J\x1b[3J\x1b[H${currentPrompt()}`)
      } else {
        terminal.write(`\r\n${run(line, SAMPLES[sample].path).map((output) => `${output}\r\n`).join('')}${currentPrompt()}`)
      }
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
  })

  const measure = () => {
    const screen = host.querySelector('.xterm-screen')
    const size = terminal.options.fontSize

    if (screen?.offsetWidth) {
      cell.width = screen.offsetWidth / (COLS * size)
      cell.height = screen.offsetHeight / (ROWS * size)
    }
  }

  const fit = () => {
    const size = fontSize()

    if (size !== terminal.options.fontSize) {
      terminal.options.fontSize = size
    }
  }

  measure()
  fit()
  new ResizeObserver(fit).observe(host)

  /*
   * Full screen: the frame covers the window, and the browser's own full screen is asked for where
   * it has one. Esc, the button, or leaving the browser's full screen brings the frame back.
   */
  const toggle = frame.querySelector('.fullscreen-toggle')

  const setFullscreen = (on) => {
    if (on === isFullscreen()) {
      return
    }

    frame.classList.toggle('is-fullscreen', on)
    document.documentElement.classList.toggle('has-fullscreen-terminal', on)

    if (toggle) {
      toggle.setAttribute('aria-pressed', String(on))
      toggle.title = on ? toggle.dataset.exitTitle : toggle.getAttribute('aria-label')
    }

    if (on) {
      // A phone browser without it keeps the frame over the page alone
      frame.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {})
      terminal.focus()
    } else {
      if (document.fullscreenElement === frame) {
        document.exitFullscreen().catch(() => {})
      }

      toggle?.focus()
    }

    fit()
  }

  toggle?.addEventListener('click', () => setFullscreen(!isFullscreen()))
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isFullscreen()) {
      setFullscreen(false)
    }
  })
  // The terminal keeps the keys it reads, so Esc is caught before it gets there
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && isFullscreen()) {
        event.preventDefault()
        setFullscreen(false)
      }
    },
    true,
  )

  const showSample = async (name) => {
    sample = name

    const text = await loadSample(name)
    const { path, selection } = SAMPLES[name]

    if (name !== sample) {
      return
    }

    terminal.reset()
    typed = ''
    terminal.write(`${text}${prompt(path)}`, () => {
      terminal.select(selection.column, selection.row, selection.length)
    })
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const other of buttons) {
        other.setAttribute('aria-pressed', String(other === button))
      }

      showSample(button.dataset.sample)
    })
  }

  return {
    // A new scheme changes only the colors; what the terminal shows stays
    setColors: (colors) => {
      terminal.options.theme = toTheme(colors)
      frame.style.setProperty('--scheme-bg', colors.background.slice(0, 7))
      frame.style.setProperty('--scheme-fg', colors.foreground.slice(0, 7))
    },
    showSample,
  }
}
