// The few commands the preview terminal answers, `ls` and `pwd`, read from a made-up directory tree
// that matches what the sample sessions show.

const HOME = '/home/demo'
const WIDTH = 68

// Whether a character takes two columns, as Hangul, kana and Han characters do
export const isWide = (char) => {
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

const textWidth = (text) => [...text].reduce((width, char) => width + (isWide(char) ? 2 : 1), 0)

/*
 * Each directory's entries as [name, type, size, time, link target or mode]. The type is d for a
 * directory, x for a program, z for an archive, l for a link and f for any other file, which is
 * also what ls colors them by.
 */
const TREE = {
  '/': [
    ['bin', 'l', '7', '09:00', 'usr/bin'],
    ['boot', 'd'],
    ['dev', 'd'],
    ['etc', 'd'],
    ['home', 'd'],
    ['lib', 'l', '7', '09:00', 'usr/lib'],
    ['opt', 'd'],
    ['root', 'd', '4096', '09:00', 'drwx------'],
    ['tmp', 'd', '4096', '09:20', 'drwxrwxrwt'],
    ['usr', 'd'],
    ['var', 'd'],
  ],
  '/home': [['demo', 'd']],
  '/home/demo': [
    ['.bash_history', 'f', '2.4K', '09:20', '-rw-------'],
    ['.bash_logout', 'f', '220', '09:00'],
    ['.bashrc', 'f', '3.7K', '09:00'],
    ['.config', 'd'],
    ['.profile', 'f', '807', '09:00'],
    ['.ssh', 'd', '4096', '09:02', 'drwx------'],
    ['projects', 'd'],
    ['文書', 'd'],
  ],
  '/home/demo/projects': [['aurora', 'd']],
  '/home/demo/projects/aurora': [
    ['.editorconfig', 'f', '182', '09:10'],
    ['.git', 'd', '4096', '09:16'],
    ['.gitignore', 'f', '64', '09:10'],
    ['current', 'l', '12', '09:14', 'releases/2.4'],
    ['deploy.sh', 'x', '812', '09:12'],
    ['docs', 'd'],
    ['notes.md', 'f', '318', '09:15'],
    ['package.json', 'f', '642', '09:10'],
    ['release.tar.gz', 'z', '9.1M', '09:14'],
    ['releases', 'd'],
    ['src', 'd'],
    ['tests', 'd'],
  ],
  '/home/demo/文書': [
    ['.git', 'd', '4096', '09:16'],
    ['package.json', 'f', '588', '09:10'],
    ['写真', 'd'],
    ['表.txt', 'f', '1.2K', '09:13'],
    ['設計書.zip', 'z', '14K', '09:14'],
    ['배포.sh', 'x', '640', '09:15'],
    ['인사.txt', 'f', '412', '09:13'],
    ['테스트', 'd'],
    ['テスト', 'd'],
    ['회의록.md', 'f', '2.1K', '09:12'],
  ],
}

const MODES = { d: 'drwxr-xr-x', x: '-rwxr-xr-x', z: '-rw-r--r--', l: 'lrwxrwxrwx', f: '-rw-r--r--' }
const COLORS = { d: '1;34', x: '1;32', z: '1;31', l: '1;36' }

const entry = ([name, type, size = type === 'd' ? '4096' : '0', time = '09:12', extra = '']) => ({
  name,
  type,
  size,
  time,
  mode: type !== 'l' && extra ? extra : MODES[type],
  target: type === 'l' ? extra : '',
})

const byName = (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)

const paint = ({ name, type }) => (COLORS[type] ? `\x1b[${COLORS[type]}m${name}\x1b[0m` : name)

const longLine = (item) =>
  `${item.mode} ${item.type === 'd' ? 2 : 1} demo demo ${item.size.padStart(4)} Nov 18 ${item.time} ${paint(item)}${item.target ? ` -> ${item.target}` : ''}`

// Names in as many columns as fit the terminal, read down each column first, as ls prints them
const columns = (items) => {
  if (items.length === 0) {
    return []
  }

  const width = Math.max(...items.map((item) => textWidth(item.name))) + 2
  const perLine = Math.max(1, Math.floor((WIDTH + 2) / width))
  const rows = Math.ceil(items.length / perLine)
  const lines = []

  for (let row = 0; row < rows; row += 1) {
    const cells = []

    for (let column = row; column < items.length; column += rows) {
      const item = items[column]
      const last = column + rows >= items.length

      cells.push(last ? paint(item) : `${paint(item)}${' '.repeat(width - textWidth(item.name))}`)
    }

    lines.push(cells.join(''))
  }

  return lines
}

// A path as the shell reads it, from the directory the prompt is in
const resolve = (cwd, target) => {
  const path = target === '~' || target.startsWith('~/') ? `${HOME}${target.slice(1)}` : target.startsWith('/') ? target : `${cwd}/${target}`
  const parts = []

  for (const part of path.split('/')) {
    if (part === '..') {
      parts.pop()
    } else if (part && part !== '.') {
      parts.push(part)
    }
  }

  return `/${parts.join('/')}`
}

const parent = (path) => path.replace(/\/[^/]*$/, '') || '/'

// What a path names: a directory's entries, a single file, or nothing
const lookup = (path) => {
  if (TREE[path]) {
    return { directory: TREE[path].map(entry) }
  }

  const name = path.split('/').pop()
  const found = (TREE[parent(path)] ?? []).map(entry).find((item) => item.name === name)

  if (!found) {
    return null
  }

  // A directory nobody wrote out is empty; a link is listed as itself
  return found.type === 'd' ? { directory: [] } : { file: found }
}

const ls = (args, cwd) => {
  const flags = new Set()
  const targets = []

  for (const arg of args) {
    if (arg === '--all') {
      flags.add('a')
    } else if (arg === '--color' || arg.startsWith('--color=')) {
      // Always in color here
    } else if (arg.startsWith('--')) {
      return [`ls: unrecognized option '${arg}'`, "Try 'ls --help' for more information."]
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (const flag of arg.slice(1)) {
        if (!'alAh1'.includes(flag)) {
          return [`ls: invalid option -- '${flag}'`, "Try 'ls --help' for more information."]
        }

        flags.add(flag)
      }
    } else {
      targets.push(arg)
    }
  }

  const long = flags.has('l')
  const one = flags.has('1')
  const list = (items) => (long ? items.map(longLine) : one ? items.map(paint) : columns(items))
  const errors = []
  const files = []
  const directories = []

  for (const target of targets.length ? targets : ['.']) {
    const path = resolve(cwd, target)
    const found = lookup(path)

    if (!found) {
      errors.push(`ls: cannot access '${target}': No such file or directory`)
    } else if (found.file) {
      files.push({ ...found.file, name: target })
    } else {
      let items = found.directory

      if (!flags.has('a') && !flags.has('A')) {
        items = items.filter((item) => !item.name.startsWith('.'))
      }

      items = items.sort(byName)

      if (flags.has('a')) {
        items = [entry(['.', 'd']), entry(['..', 'd']), ...items]
      }

      directories.push({ target, items })
    }
  }

  const output = [...errors, ...list(files)]

  directories.forEach(({ target, items }, index) => {
    if (targets.length > 1) {
      if (output.length || index > 0) {
        output.push('')
      }

      output.push(`${target}:`)
    }

    output.push(...list(items))
  })

  return output
}

/*
 * The lines a command prints, from the directory the prompt shows (~ or a path under it). What
 * the preview does not know is answered the way bash answers a missing program.
 */
export const run = (line, prompt) => {
  const [command, ...args] = line.trim().split(/\s+/)
  const cwd = resolve(HOME, prompt)

  if (!command) {
    return []
  }

  if (command === 'pwd') {
    return [cwd]
  }

  if (command === 'ls') {
    return ls(args, cwd)
  }

  return [`bash: ${command}: command not found`]
}
