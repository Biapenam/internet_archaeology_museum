#!/usr/bin/env node

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const dist = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function usage() {
  console.log(`Internet Archaeology Museum

Usage: internet-archaeology-museum [options]

Options:
  -p, --port <number>  Local port (default: 4173)
      --host <host>    Listening host (default: 127.0.0.1)
      --no-open        Do not open the browser automatically
  -h, --help           Show this help

Press Ctrl+C to stop the museum.`)
}

function parseArgs(args) {
  let port = 4173
  let host = '127.0.0.1'
  let open = true
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '-h' || arg === '--help') return { help: true }
    if (arg === '--no-open') { open = false; continue }
    if (arg === '-p' || arg === '--port') {
      const value = args[++index]
      if (!value || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw new Error('Port must be an integer from 1 to 65535.')
      port = Number(value)
      continue
    }
    if (arg === '--host') {
      const value = args[++index]
      if (!value || value.startsWith('-')) throw new Error('A host value is required after --host.')
      host = value
      continue
    }
    throw new Error(`Unknown option: ${arg}`)
  }
  return { port, host, open }
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url]
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true })
  child.on('error', () => console.error(`Could not open the browser automatically. Open ${url} manually.`))
  child.unref()
}

async function serve(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  let pathname
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname) }
  catch { response.writeHead(400).end('Bad request'); return }
  const target = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (target !== dist && !target.startsWith(`${dist}${sep}`)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  let info
  try { info = await stat(target) }
  catch { response.writeHead(404).end('Not found'); return }
  if (!info.isFile()) { response.writeHead(404).end('Not found'); return }

  response.writeHead(200, {
    'Content-Type': mime[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': target.endsWith(`${sep}index.html`) ? 'no-cache' : 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  })
  if (request.method === 'HEAD') { response.end(); return }
  createReadStream(target).on('error', () => response.destroy()).pipe(response)
}

try {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) usage()
  else {
    await stat(resolve(dist, 'index.html'))
    const server = createServer((request, response) => { void serve(request, response) })
    server.on('error', (error) => {
      console.error(`Could not start the museum: ${error.message}`)
      process.exitCode = 1
    })
    server.listen(options.port, options.host, () => {
      const publicHost = options.host === '0.0.0.0' || options.host === '::' ? '127.0.0.1' : options.host
      const url = `http://${publicHost}:${options.port}/`
      console.log(`Internet Archaeology Museum is ready at ${url}`)
      console.log('Press Ctrl+C to stop.')
      if (options.open) openBrowser(url)
    })
  }
} catch (error) {
  console.error(`Could not start the museum: ${error.message}`)
  process.exitCode = 1
}
