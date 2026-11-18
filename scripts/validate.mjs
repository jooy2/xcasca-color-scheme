// Checks every color scheme file and credits.json, and fails when something would break the
// import in the app or the collection's rules.
//
//   node scripts/validate.mjs
//
// In GitHub Actions each problem is also an annotation on the file, and the result goes to the
// job summary.

import { appendFileSync } from 'node:fs'
import { checkSchemes } from './lib/schemes.mjs'

const { errors, warnings, schemes } = checkSchemes()
const inActions = process.env.GITHUB_ACTIONS === 'true'
const escape = (text) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')

for (const { file, message } of errors) {
  console.log(inActions ? `::error file=${file}::${escape(message)}` : `error    ${file}: ${message}`)
}

for (const { file, message } of warnings) {
  console.log(inActions ? `::warning file=${file}::${escape(message)}` : `warning  ${file}: ${message}`)
}

const dark = schemes.filter((scheme) => scheme.dark).length
const summary = errors.length
  ? `${errors.length} problem${errors.length === 1 ? '' : 's'} found in ${schemes.length} color schemes.`
  : `All ${schemes.length} color schemes are valid (${dark} dark, ${schemes.length - dark} light).`

console.log(summary)

if (inActions && process.env.GITHUB_STEP_SUMMARY) {
  const rows = [...errors.map((x) => ['Error', x]), ...warnings.map((x) => ['Warning', x])]
    .map(([level, { file, message }]) => `| ${level} | \`${file}\` | ${message.replace(/\|/g, '\\|')} |`)
    .join('\n')

  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Color scheme check\n\n${summary}\n\n${rows ? `| | File | Problem |\n|---|---|---|\n${rows}\n` : ''}`,
  )
}

process.exit(errors.length ? 1 : 0)
