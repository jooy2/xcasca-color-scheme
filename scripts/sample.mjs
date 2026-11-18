// Writes the terminal session every color scheme is previewed with: a short, made-up session that
// uses all sixteen ANSI colors, bold, dim and underline, so two schemes can be compared line by line.
//
//   node scripts/sample.mjs            writes site/sample.ansi (66 columns, 25 lines)
//   node scripts/sample.mjs --narrow   prints a 40-column version for a phone screen
//
// The file holds plain LF line endings; the preview page renders it with `convertEol`.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ESC = '\x1b['
const style = (codes, text) => `${ESC}${codes}m${text}${ESC}0m`

const bold = (text) => style('1', text)
const dim = (text) => style('2', text)
const fg = (n, text, extra = '') => style(`${extra}${n < 8 ? 30 + n : 82 + n}`, text)
const bg = (n, text, extra = '') => style(`${extra}${n < 8 ? 40 + n : 92 + n}`, text)

const [BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE] = [0, 1, 2, 3, 4, 5, 6, 7]
const BRIGHT_BLACK = 8
const BRIGHT_MAGENTA = 13

const prompt = (path) => `${fg(GREEN, 'demo@devbox', '1;')}:${fg(BLUE, path, '1;')}$ `

const swatches = (from, width) =>
  Array.from({ length: 8 }, (_, i) => bg(from + i, ' '.repeat(width))).join(' ')

const wide = () => {
  const p = prompt('~/projects/aurora')

  return [
    `${p}ls -l`,
    `drwxr-xr-x 2 demo demo 4096 Nov 18 09:12 ${fg(BLUE, 'docs', '1;')}`,
    `-rwxr-xr-x 1 demo demo  812 Nov 18 09:12 ${fg(GREEN, 'deploy.sh', '1;')}`,
    `-rw-r--r-- 1 demo demo 9.1M Nov 18 09:14 ${fg(RED, 'release.tar.gz', '1;')}`,
    `lrwxrwxrwx 1 demo demo   12 Nov 18 09:14 ${fg(CYAN, 'current', '1;')} -> releases/2.4`,
    `${p}git status -sb`,
    `## ${fg(GREEN, 'main')}...${fg(RED, 'origin/main')} [ahead ${fg(GREEN, '2')}]`,
    ` ${fg(RED, 'M')} src/server.ts   ${fg(GREEN, 'A')}  src/health.ts   ${fg(RED, '??')} notes.md`,
    `${p}git log --oneline -3`,
    `${fg(YELLOW, '3f2a91c')} ${fg(YELLOW, '(')}${fg(CYAN, 'HEAD -> ', '1;')}${fg(GREEN, 'main', '1;')}${fg(YELLOW, ')')} Add a health check endpoint`,
    `${fg(YELLOW, '8c1d0e7')} Cache session tokens in memory`,
    `${fg(YELLOW, 'b47e2d0')} ${fg(YELLOW, '(')}${fg(YELLOW, 'tag: v2.4.0', '1;')}${fg(YELLOW, ')')} Release 2.4.0`,
    `${p}cat src/health.ts`,
    `${fg(MAGENTA, 'export')} ${fg(BLUE, 'function')} ${fg(YELLOW, 'health')}(${fg(CYAN, 'req')}: ${fg(GREEN, 'Request')}) {`,
    `  ${fg(BRIGHT_BLACK, '// Report the uptime and the build in one call', '3;')}`,
    `  ${fg(MAGENTA, 'return')} { status: ${fg(GREEN, '"ok"')}, uptime: ${fg(BRIGHT_MAGENTA, '3600')}, build: ${fg(GREEN, '"2.4.1"')} }`,
    `}`,
    `${p}npm test`,
    `${bg(GREEN, ' PASS ', '1;30;')} tests/health.test.ts ${dim('(12 ms)')}`,
    `${bg(RED, ' FAIL ', '1;97;')} tests/cache.test.ts ${dim('(48 ms)')}`,
    `Tests: ${fg(RED, '1 failed', '1;')}, ${fg(GREEN, '11 passed', '1;')}, 12 total  ${style('4;34', 'https://example.com/ci/1042')}`,
    `${p}palette`,
    swatches(BLACK, 6),
    swatches(8, 6),
  ]
}

const narrow = () => {
  const p = prompt('~/aurora')

  return [
    `${p}git status -sb`,
    `## ${fg(GREEN, 'main')}...${fg(RED, 'origin/main')} [ahead ${fg(GREEN, '2')}]`,
    ` ${fg(RED, 'M')} src/server.ts`,
    `${fg(GREEN, 'A')}  src/health.ts`,
    `${fg(RED, '??')} notes.md`,
    `${p}git log --oneline -3`,
    `${fg(YELLOW, '3f2a91c')} ${fg(YELLOW, '(')}${fg(CYAN, 'HEAD -> ', '1;')}${fg(GREEN, 'main', '1;')}${fg(YELLOW, ')')} Add health`,
    `${fg(YELLOW, '8c1d0e7')} Cache session tokens`,
    `${fg(YELLOW, 'b47e2d0')} ${fg(YELLOW, '(')}${fg(YELLOW, 'tag: v2.4.0', '1;')}${fg(YELLOW, ')')} Release`,
    `${p}cat src/health.ts`,
    `${fg(MAGENTA, 'export')} ${fg(BLUE, 'function')} ${fg(YELLOW, 'health')}() {`,
    `  ${fg(BRIGHT_BLACK, '// Uptime and build', '3;')}`,
    `  ${fg(MAGENTA, 'return')} { status: ${fg(GREEN, '"ok"')},`,
    `    uptime: ${fg(BRIGHT_MAGENTA, '3600')} }`,
    `}`,
    `${p}npm test`,
    `${bg(GREEN, ' PASS ', '1;30;')} health.test.ts ${dim('12 ms')}`,
    `${bg(RED, ' FAIL ', '1;97;')} cache.test.ts ${dim('48 ms')}`,
    `Tests: ${fg(RED, '1 failed', '1;')}, ${fg(GREEN, '11 passed', '1;')}`,
    `${p}palette`,
    swatches(BLACK, 3),
    swatches(8, 3),
  ]
}

const isNarrow = process.argv.includes('--narrow')
const text = `${(isNarrow ? narrow() : wide()).join('\n')}\n`

if (isNarrow) {
  process.stdout.write(text)
} else {
  writeFileSync(fileURLToPath(new URL('../site/sample.ansi', import.meta.url)), text)
}
