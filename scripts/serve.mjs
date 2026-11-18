// Serves _site/ at http://localhost:4173 to look at the gallery before pushing.
//
//   npm run preview

import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { ROOT } from './lib/schemes.mjs'

const SITE = join(ROOT, '_site')
const PORT = Number(process.env.PORT ?? 4173)
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ansi': 'text/plain; charset=utf-8',
  '.xccolorscheme': 'application/json; charset=utf-8',
}

createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  let file = normalize(join(SITE, path))

  if (!file.startsWith(SITE)) {
    response.writeHead(403).end()
    return
  }

  if (existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, 'index.html')
  }

  if (!existsSync(file)) {
    response.writeHead(404).end('Not found')
    return
  }

  response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  response.end(readFileSync(file))
}).listen(PORT, () => console.log(`Gallery at http://localhost:${PORT}`))
