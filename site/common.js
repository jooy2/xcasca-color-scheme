// What the gallery and the editor share: the page's language and paths, the theme and language
// switches, and the terminal preview drawn with xterm.js.

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

const fontSizeFor = (width) => {
  // JetBrains Mono is 0.6 em wide; leave the frame's padding
  const size = Math.floor(((width - 36) / (COLS * 0.6)) * 2) / 2

  return Math.max(8, Math.min(15, size))
}

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

/*
 * A terminal in `frame` that shows a sample session in a scheme's colors. The tabs in the frame
 * pick the session, and a visitor can type in it: nothing runs behind it, so what is typed is shown
 * on the line, Enter starts a new prompt, and `clear` or Ctrl+L clears the screen.
 */
export const createPreview = async (frame) => {
  const host = frame.querySelector('.terminal')
  const buttons = [...frame.querySelectorAll('[data-sample]')]
  let sample = 'shell'
  let typed = ''

  // The terminal measures its font when it opens, so the font has to be there first
  await Promise.all([document.fonts.load(`15px ${FONT}`), document.fonts.load(`bold 15px ${FONT}`)]).catch(() => {})

  const terminal = new Terminal({
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
  const currentPrompt = () => prompt(SAMPLES[sample].path)

  terminal.open(host)
  terminal.onData((data) => {
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
  })

  new ResizeObserver(() => {
    const size = fontSizeFor(host.clientWidth)

    if (size !== terminal.options.fontSize) {
      terminal.options.fontSize = size
    }
  }).observe(host)

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
