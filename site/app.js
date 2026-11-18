// The gallery: a list of schemes on the left, and the selected one drawn on a terminal.

import {
  $,
  ANSI,
  BRIGHT,
  REPO,
  ROOT,
  bindLanguages,
  bindTheme,
  colorName,
  copyText,
  createPreview,
  element,
  icon,
  loadSchemes,
  t,
} from './common.js'
import { bindFormatMenu } from './formats.js'

const state = { schemes: [], visible: [], current: null, mode: 'all', kind: 'all', query: '' }
let preview = null

// A button that shows a color and copies its hex value
const swatch = (hex, label, className) => {
  const button = element('button', className)
  const color = element('span', 'swatch-color')

  button.type = 'button'
  button.title = `${label}: ${hex}`
  button.setAttribute('aria-label', `${label} ${hex}`)
  color.style.background = hex
  button.append(color)
  button.addEventListener('click', () => copyText(hex, t('copied', { hex })))

  return button
}

/*
 * Foreground, background and selection in a row, then the sixteen ANSI colors as a table: the
 * color names across, normal and bright down, so every cell has the same size.
 */
const renderPalette = (colors) => {
  const base = element('div', 'palette-base')

  for (const key of ['foreground', 'background', 'selection']) {
    const label = t(`palette.${key}`)
    const button = swatch(colors[key], label, 'base-swatch')
    const text = element('span', 'base-text')

    text.append(element('small', '', label), element('code', '', colors[key]))
    button.append(text)
    base.append(button)
  }

  const grid = element('div', 'palette-grid')

  grid.append(element('span', 'grid-corner'))

  for (const key of ANSI) {
    grid.append(element('span', 'grid-head', colorName(key)))
  }

  for (const [row, keys] of [[t('palette.normal'), ANSI], [t('palette.bright'), BRIGHT]]) {
    grid.append(element('span', 'grid-row', row))

    for (const key of keys) {
      const button = swatch(colors[key], colorName(key), 'grid-swatch')

      button.append(element('code', '', colors[key].toUpperCase()))
      grid.append(button)
    }
  }

  $('palette').replaceChildren(base, grid)
}

const renderViewer = () => {
  const scheme = state.current
  const path = scheme.file.split('/').map(encodeURIComponent).join('/')
  const credit = $('scheme-credit')
  const link = element('a', '', scheme.author)

  document.title = `${scheme.name} · ${t('siteName')}`
  $('scheme-name').textContent = scheme.name
  link.href = scheme.url
  link.rel = 'noopener'

  // The author is a link wherever the language puts it in the line
  const [before, after] = t('credit', {
    kind: t(`kind.${scheme.kind}`),
    mode: t(scheme.dark ? 'mode.dark' : 'mode.light'),
    license: scheme.license,
  }).split('{author}')

  credit.replaceChildren(before, link, after ?? '')
  $('download').href = `${ROOT}${path}`
  $('download').setAttribute('download', scheme.file.split('/').pop())
  $('source').href = `${REPO}/blob/main/${path}`
  $('customize').href = `editor/#${encodeURIComponent(scheme.name)}`

  renderPalette(scheme.colors)
  preview?.setColors(scheme.colors)
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

  $('count').textContent = t('count', { shown: state.visible.length, total: state.schemes.length })

  if (state.visible.length === 0) {
    $('list').replaceChildren(element('li', 'empty', t('empty')))
    return
  }

  $('list').replaceChildren(
    ...state.visible.map((scheme) => {
      const item = element('li')
      const button = element('button')
      const mini = element('span', 'mini')
      const tag = element('span', 'tag')

      button.type = 'button'
      button.dataset.name = scheme.name
      button.setAttribute('aria-current', String(scheme === state.current))
      mini.style.background = scheme.colors.background

      for (const key of [...ANSI, ...BRIGHT]) {
        const cell = element('i')

        cell.style.background = scheme.colors[key]
        mini.append(cell)
      }

      tag.title = t(scheme.dark ? 'mode.dark' : 'mode.light')
      tag.append(icon(scheme.dark ? 'moon' : 'sun'))
      button.append(mini, element('span', 'name', scheme.name), tag)
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

// The Desktop and Android tabs of the steps
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

const main = async () => {
  bindTheme()
  bindLanguages()
  bindFilters()
  bindTabs()
  bindFormatMenu($('formats'), () => state.current)

  const index = await loadSchemes()

  state.schemes = index.terminal
  preview = await createPreview($('frame'))

  const fromHash = decodeURIComponent(location.hash.slice(1))
  const first =
    state.schemes.find((scheme) => scheme.name === fromHash) ??
    state.schemes.find((scheme) => scheme.name === 'Harbor Night') ??
    state.schemes[0]

  state.current = first
  renderList()
  select(first, { updateHash: false })
  await preview.showSample('shell')

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
  $('scheme-name').textContent = t('loadError')
  $('scheme-credit').textContent = String(error)
})
