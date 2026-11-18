// A scheme written for other terminal apps, and the menu that downloads it. Each format carries the
// foreground, background, cursor, selection and the sixteen ANSI colors; the search highlight
// colors are Xcasca's own and have no place in the others.

import { ANSI, BRIGHT, element, saveFile } from './common.js'

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const toHex = (values) => `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`

/*
 * The other apps take a solid selection color, while Xcasca draws its selection over the text with
 * the alpha it carries, so the selection is mixed with the background into the color it shows.
 */
const solidSelection = ({ selection, background }) => {
  const alpha = selection.length === 9 ? parseInt(selection.slice(7), 16) / 255 : 1
  const back = channels(background)

  return toHex(channels(selection).map((value, i) => Math.round(value * alpha + back[i] * (1 - alpha))))
}

// The colors every format needs, as lowercase #rrggbb
const palette = (colors) => {
  const lower = Object.fromEntries([...ANSI, ...BRIGHT, 'foreground', 'background'].map((key) => [key, colors[key].slice(0, 7).toLowerCase()]))

  return { ...lower, selection: solidSelection(colors), ansi: ANSI.map((key) => lower[key]), brights: BRIGHT.map((key) => lower[key]) }
}

const xshell = ({ name }, c) => {
  // A bracket would end the section's name early
  const section = name.replace(/\[/g, '(').replace(/]/g, ')')
  const bare = (hex) => hex.slice(1)
  const lines = [
    `[${section}]`,
    `text=${bare(c.foreground)}`,
    `text(bold)=${bare(c.foreground)}`,
    `background=${bare(c.background)}`,
    ...ANSI.flatMap((key, i) => [`${key}=${bare(c.ansi[i])}`, `${key}(bold)=${bare(c.brights[i])}`]),
    '[Names]',
    `name0=${section}`,
    'count=1',
  ]

  // Xshell runs on Windows, whose own files end their lines with CR LF
  return `${lines.join('\r\n')}\r\n`
}

const windowsTerminal = ({ name }, c) => {
  const windowsName = (key) => key.replace('magenta', 'purple').replace('Magenta', 'Purple')

  return `${JSON.stringify(
    {
      name,
      background: c.background,
      foreground: c.foreground,
      cursorColor: c.foreground,
      selectionBackground: c.selection,
      ...Object.fromEntries([...ANSI, ...BRIGHT].map((key) => [windowsName(key), c[key]])),
    },
    null,
    4,
  )}\n`
}

const iterm = (scheme, c) => {
  const color = (key, hex) => {
    const [r, g, b] = channels(hex).map((value) => (value / 255).toFixed(6).replace(/0+$/, '').replace(/\.$/, ''))

    return [
      `\t<key>${key}</key>`,
      '\t<dict>',
      '\t\t<key>Alpha Component</key>',
      '\t\t<real>1</real>',
      '\t\t<key>Blue Component</key>',
      `\t\t<real>${b}</real>`,
      '\t\t<key>Color Space</key>',
      '\t\t<string>sRGB</string>',
      '\t\t<key>Green Component</key>',
      `\t\t<real>${g}</real>`,
      '\t\t<key>Red Component</key>',
      `\t\t<real>${r}</real>`,
      '\t</dict>',
    ]
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    ...[...c.ansi, ...c.brights].flatMap((hex, i) => color(`Ansi ${i} Color`, hex)),
    ...color('Background Color', c.background),
    ...color('Bold Color', c.foreground),
    ...color('Cursor Color', c.foreground),
    ...color('Cursor Text Color', c.background),
    ...color('Foreground Color', c.foreground),
    ...color('Selected Text Color', c.foreground),
    ...color('Selection Color', c.selection),
    '</dict>',
    '</plist>',
    '',
  ].join('\n')
}

const ghostty = ({ name }, c) =>
  [
    `# ${name}`,
    ...[...c.ansi, ...c.brights].map((hex, i) => `palette = ${i}=${hex}`),
    `background = ${c.background}`,
    `foreground = ${c.foreground}`,
    `cursor-color = ${c.foreground}`,
    `cursor-text = ${c.background}`,
    `selection-background = ${c.selection}`,
    `selection-foreground = ${c.foreground}`,
    '',
  ].join('\n')

const toml = (value) => JSON.stringify(value)

const alacritty = ({ name }, c) =>
  [
    `# ${name}`,
    '',
    '[colors.primary]',
    `background = ${toml(c.background)}`,
    `foreground = ${toml(c.foreground)}`,
    '',
    '[colors.cursor]',
    `text = ${toml(c.background)}`,
    `cursor = ${toml(c.foreground)}`,
    '',
    '[colors.selection]',
    'text = "CellForeground"',
    `background = ${toml(c.selection)}`,
    '',
    '[colors.normal]',
    ...ANSI.map((key, i) => `${key} = ${toml(c.ansi[i])}`),
    '',
    '[colors.bright]',
    ...ANSI.map((key, i) => `${key} = ${toml(c.brights[i])}`),
    '',
  ].join('\n')

const kitty = ({ name, author, license }, c) =>
  [
    `## name: ${name}`,
    ...(author ? [`## author: ${author}`] : []),
    ...(license ? [`## license: ${license}`] : []),
    '',
    `foreground ${c.foreground}`,
    `background ${c.background}`,
    'selection_foreground none',
    `selection_background ${c.selection}`,
    `cursor ${c.foreground}`,
    `cursor_text_color ${c.background}`,
    '',
    ...[...c.ansi, ...c.brights].map((hex, i) => `color${i} ${hex}`),
    '',
  ].join('\n')

const wezterm = ({ name, author }, c) =>
  [
    '[colors]',
    `foreground = ${toml(c.foreground)}`,
    `background = ${toml(c.background)}`,
    `cursor_bg = ${toml(c.foreground)}`,
    `cursor_fg = ${toml(c.background)}`,
    `cursor_border = ${toml(c.foreground)}`,
    `selection_fg = ${toml(c.foreground)}`,
    `selection_bg = ${toml(c.selection)}`,
    `ansi = [${c.ansi.map(toml).join(', ')}]`,
    `brights = [${c.brights.map(toml).join(', ')}]`,
    '',
    '[metadata]',
    `name = ${toml(name)}`,
    ...(author ? [`author = ${toml(author)}`] : []),
    '',
  ].join('\n')

export const FORMATS = [
  { id: 'xshell', app: 'Xshell', extension: '.xcs', type: 'text/plain', write: xshell },
  { id: 'windows-terminal', app: 'Windows Terminal', extension: '.json', type: 'application/json', write: windowsTerminal },
  { id: 'iterm2', app: 'iTerm2', extension: '.itermcolors', type: 'application/xml', write: iterm },
  // Ghostty finds a theme by its file name, which has no extension
  { id: 'ghostty', app: 'Ghostty', extension: '', type: 'application/octet-stream', write: ghostty },
  { id: 'alacritty', app: 'Alacritty', extension: '.toml', type: 'text/plain', write: alacritty },
  { id: 'kitty', app: 'Kitty', extension: '.conf', type: 'text/plain', write: kitty },
  // WezTerm reads any .toml in its colors folder; the longer name keeps it apart from Alacritty's
  { id: 'wezterm', app: 'WezTerm', extension: '.toml', fileExtension: '.wezterm.toml', type: 'text/plain', write: wezterm },
]

// A file name the way Xcasca names an exported scheme: no dots or spaces at the end
export const fileBase = (name) => name.trim().replace(/[. ]+$/, '') || 'terminalColor'

/*
 * Fill a format menu, a <details> with a .format-list inside, with one button per app. `current`
 * gives the scheme to write: its name, its colors, and its author and license where they are known.
 */
export const bindFormatMenu = (menu, current) => {
  const list = menu.querySelector('.format-list')

  list.replaceChildren(
    ...FORMATS.map((format) => {
      const button = element('button', 'format-item')

      button.type = 'button'
      button.append(element('span', '', format.app), element('code', '', format.extension))
      button.addEventListener('click', () => {
        const scheme = current()

        saveFile(`${fileBase(scheme.name)}${format.fileExtension ?? format.extension}`, format.write(scheme, palette(scheme.colors)), format.type)
        menu.open = false
      })

      return button
    }),
  )

  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false
      menu.querySelector('summary').focus()
    }
  })
  document.addEventListener('click', (event) => {
    if (menu.open && !menu.contains(event.target)) {
      menu.open = false
    }
  })

  // The editor turns the menu off while the scheme has no usable name
  const summary = menu.querySelector('summary')

  summary.addEventListener('click', (event) => {
    if (summary.getAttribute('aria-disabled') === 'true') {
      event.preventDefault()
    }
  })

  return {
    setEnabled: (enabled) => {
      summary.setAttribute('aria-disabled', String(!enabled))

      if (!enabled) {
        menu.open = false
      }
    },
  }
}
