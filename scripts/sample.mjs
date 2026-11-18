// Writes the terminal sessions the gallery previews a scheme with, into site/samples/. Each one is
// made up, fits 68 columns and 24 lines, and stays the same for every scheme, so two schemes can be
// compared line by line.
//
//   node scripts/sample.mjs            writes shell, code, colors and cjk .ansi
//   node scripts/sample.mjs --narrow   prints a 40-column shell session for a phone screen
//
// The files hold plain LF line endings; the gallery renders them with `convertEol`.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const COLUMNS = 68
const LINES = 24
const ESC = '\x1b['
const style = (codes, text) => `${ESC}${codes}m${text}${ESC}0m`

const bold = (text) => style('1', text)
const dim = (text) => style('2', text)
const fg = (n, text, extra = '') => style(`${extra}${n < 8 ? 30 + n : 82 + n}`, text)
const bg = (n, text, extra = '') => style(`${extra}${n < 8 ? 40 + n : 92 + n}`, text)

const [BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE] = [0, 1, 2, 3, 4, 5, 6, 7]
const BRIGHT_BLACK = 8
const BRIGHT_MAGENTA = 13
const NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

const prompt = (path) => `${fg(GREEN, 'demo@devbox', '1;')}:${fg(BLUE, path, '1;')}$ `
const swatches = (from, width) => Array.from({ length: 8 }, (_, i) => bg(from + i, ' '.repeat(width))).join(' ')
const pad = (text, width) => text + ' '.repeat(Math.max(0, width - text.length))

// Columns a line takes on screen: East Asian wide characters take two
const displayWidth = (line) =>
  [...line.replace(/\x1b\[[0-9;]*m/g, '')].reduce((sum, char) => {
    const code = char.codePointAt(0)
    const wide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)

    return sum + (wide ? 2 : 1)
  }, 0)

const shell = () => {
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

const code = () => {
  const p = prompt('~/projects/aurora')
  const n = (number) => fg(BRIGHT_BLACK, `${String(number).padStart(3)} │ `)
  const kw = (text) => fg(MAGENTA, text)
  const fn = (text) => fg(BLUE, text)
  const str = (text) => fg(GREEN, text)
  const num = (text) => fg(BRIGHT_MAGENTA, text)
  const type = (text) => fg(CYAN, text)
  const comment = (text) => fg(BRIGHT_BLACK, text, '3;')

  return [
    `${p}git diff src/cache.py`,
    bold('diff --git a/src/cache.py b/src/cache.py'),
    bold('--- a/src/cache.py'),
    bold('+++ b/src/cache.py'),
    `${fg(CYAN, '@@ -14,5 +14,8 @@')} class TokenCache:`,
    `     def get(self, key):`,
    fg(RED, '-        return self._items[key]'),
    fg(GREEN, '+        entry = self._items.get(key)'),
    fg(GREEN, '+        if entry and entry.expires > time.time():'),
    fg(GREEN, '+            return entry.value'),
    fg(GREEN, '+        return None'),
    `${p}bat --plain --number src/cache.py`,
    `${n(1)}${kw('import')} time`,
    `${n(2)}${kw('from')} dataclasses ${kw('import')} dataclass`,
    `${n(3)}`,
    `${n(4)}${fg(YELLOW, '@dataclass')}`,
    `${n(5)}${kw('class')} ${type('Entry')}:`,
    `${n(6)}    value: ${type('str')}`,
    `${n(7)}    expires: ${type('float')}  ${comment('# seconds since the epoch')}`,
    `${n(8)}`,
    `${n(9)}${kw('class')} ${type('TokenCache')}:`,
    `${n(10)}    ${comment('"""Keeps tokens until they expire."""')}`,
    `${n(11)}    ${kw('def')} ${fn('__init__')}(self, ttl: ${type('int')} = ${num('300')}):`,
    `${n(12)}        self._items: ${type('dict')}[${type('str')}, ${type('Entry')}] = {}`,
  ]
}

const colors = () => {
  const p = prompt('~')
  const columns = [
    ['normal', 9, (i) => fg(i, 'Aa')],
    ['bright', 9, (i) => fg(8 + i, 'Aa')],
    ['bold', 9, (i) => fg(i, 'Aa', '1;')],
    ['dim', 9, (i) => fg(i, 'Aa', '2;')],
    ['background', 12, (i) => style(`${i === BLACK ? 97 : 30};${40 + i}`, ' Aa ')],
    ['bright bg', 9, (i) => style(`30;${100 + i}`, ' Aa ')],
  ]
  const cellWidth = { 'background': 4, 'bright bg': 4 }
  const cell = (name, width, text) => text + ' '.repeat(width - (cellWidth[name] ?? 2))

  return [
    `${p}colortest`,
    `${pad('styles', 9)}normal ${bold('bold')} ${dim('dim')} ${style('3', 'italic')} ${style('4', 'underline')} ${style('7', 'reverse')} ${style('9', 'strike')}`,
    '',
    dim(`${pad('', 9)}${columns.map(([name, width]) => pad(name, width)).join('').trimEnd()}`),
    ...NAMES.map((name, i) => `${pad(name, 9)}${columns.map(([column, width, render]) => cell(column, width, render(i))).join('').trimEnd()}`),
    '',
    dim(`${pad('bg \\ fg', 9)}${NAMES.map((_, i) => pad(` ${i}`, 5)).join('').trimEnd()}`),
    ...NAMES.map((name, b) => `${pad(name, 9)}${NAMES.map((_, i) => `${style(`${30 + i};${40 + b}`, ' Aa ')} `).join('').trimEnd()}`),
    `${pad('blocks', 9)}${fg(BLUE, '\u2588\u2593\u2592\u2591')} ${fg(GREEN, '\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588')} ${fg(YELLOW, '\u2501\u2501\u2501\u2501')}${fg(BRIGHT_BLACK, '\u2501\u2501\u2501\u2501')} ${fg(RED, '\u25cf')} ${fg(GREEN, '\u25cf')} ${fg(YELLOW, '\u25cf')} ${fg(CYAN, '\u25c6')} ${fg(MAGENTA, '\u25b2')}`,
  ]
}

const cjk = () => {
  const p = prompt('~/文書')

  return [
    `${p}ls -l`,
    `drwxr-xr-x 2 demo demo 4096 Nov 18 09:12 ${fg(BLUE, '写真', '1;')}`,
    `-rw-r--r-- 1 demo demo 2.1K Nov 18 09:12 회의록.md`,
    `-rw-r--r-- 1 demo demo  14K Nov 18 09:14 ${fg(RED, '設計書.zip', '1;')}`,
    `-rwxr-xr-x 1 demo demo  640 Nov 18 09:15 ${fg(GREEN, '배포.sh', '1;')}`,
    `${p}git log --oneline -4`,
    `${fg(YELLOW, '3f2a91c')} ${fg(YELLOW, '(')}${fg(CYAN, 'HEAD -> ', '1;')}${fg(GREEN, 'main', '1;')}${fg(YELLOW, ')')} 로그인 화면 문구 수정`,
    `${fg(YELLOW, '8c1d0e7')} 設定画面のレイアウトを調整`,
    `${fg(YELLOW, 'b47e2d0')} 修复下载进度显示错误`,
    `${fg(YELLOW, '51c9a3e')} 修正上傳檔案時的編碼問題`,
    `${p}cat 인사.txt`,
    `${fg(CYAN, '[ko]')} 안녕하세요. 터미널 색상표 미리보기입니다.`,
    `${fg(CYAN, '[ja]')} こんにちは。ターミナルの配色プレビューです。`,
    `${fg(CYAN, '[zh]')} 你好，这是终端配色方案的预览。`,
    `${fg(CYAN, '[tw]')} 你好，這是終端機配色方案的預覽。`,
    `${p}npm test`,
    `${bg(GREEN, ' PASS ', '1;30;')} 테스트/다운로드.test.ts ${dim('(12 ms)')}`,
    `${bg(RED, ' FAIL ', '1;97;')} テスト/設定.test.ts ${dim('(48 ms)')}`,
    `Tests: ${fg(RED, '1 failed 失败', '1;')}, ${fg(GREEN, '11 passed 성공', '1;')}`,
    `${p}cat 表.txt`,
    `┌────────┬──────────┬──────┐`,
    `│ 언어   │ 状態     │ 进度 │`,
    `├────────┼──────────┼──────┤`,
    `│ 한국어 │ ${fg(GREEN, '完了')}     │ ${fg(GREEN, '100%')} │`,
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

if (process.argv.includes('--narrow')) {
  process.stdout.write(`${narrow().join('\n')}\n`)
} else {
  const dir = fileURLToPath(new URL('../site/samples/', import.meta.url))

  mkdirSync(dir, { recursive: true })

  for (const [name, make] of Object.entries({ shell, code, colors, cjk })) {
    const lines = make()
    const widest = Math.max(...lines.map(displayWidth))

    if (lines.length > LINES || widest > COLUMNS) {
      throw new Error(`${name}: ${lines.length} lines, ${widest} columns; the gallery shows ${LINES} lines of ${COLUMNS}`)
    }

    writeFileSync(`${dir}${name}.ansi`, `${lines.join('\n')}\n`)
    console.log(`${name}.ansi: ${lines.length} lines, ${widest} columns`)
  }
}
