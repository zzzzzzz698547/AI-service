import { spawn } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'

const preferredPorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010]
const nextPorts = []

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.on('error', () => resolve(false))
    server.listen({ port, exclusive: true }, () => {
      server.close(() => resolve(true))
    })
  })
}

async function pickPorts() {
  for (const port of preferredPorts) {
    if (await isPortFree(port)) {
      nextPorts.push(port)
      if (nextPorts.length === 2) return
    }
  }
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', url], { stdio: 'ignore', detached: true, windowsHide: true }).unref()
  }
}

function waitForServer(port, timeoutMs = 60000) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 1000 }, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          resolve()
        } else if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`))
        } else {
          setTimeout(tick, 1000)
        }
      })

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`))
        } else {
          setTimeout(tick, 1000)
        }
      })
    }

    tick()
  })
}

async function main() {
  await pickPorts()

  if (nextPorts.length < 2) {
    console.error('No available pair of ports found between 3000 and 3010.')
    process.exit(1)
  }

  const [port1, port2] = nextPorts
  console.log(`Using ports ${port1} and ${port2}.`)

  const npmCommand = process.platform === 'win32' ? process.env.ComSpec ?? 'cmd.exe' : 'npm'

  const child1 =
    process.platform === 'win32'
      ? spawn(npmCommand, ['/d', '/s', '/c', `npm run dev -- --port ${port1}`], {
          stdio: 'inherit',
          env: { ...process.env, PORT: String(port1) }
        })
      : spawn(npmCommand, ['run', 'dev', '--', '--port', String(port1)], {
          stdio: 'inherit',
          env: { ...process.env, PORT: String(port1) }
        })

  const child2 =
    process.platform === 'win32'
      ? spawn(npmCommand, ['/d', '/s', '/c', `npm run dev -- --port ${port2}`], {
          stdio: 'inherit',
          env: { ...process.env, PORT: String(port2) }
        })
      : spawn(npmCommand, ['run', 'dev', '--', '--port', String(port2)], {
          stdio: 'inherit',
          env: { ...process.env, PORT: String(port2) }
        })

  const shutdown = () => {
    for (const child of [child1, child2]) {
      if (!child.killed) {
        child.kill('SIGINT')
      }
    }
  }

  process.on('SIGINT', () => {
    shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    shutdown()
    process.exit(0)
  })

  await Promise.all([waitForServer(port1), waitForServer(port2)])
  console.log(`Servers are running at http://localhost:${port1}/ and http://localhost:${port2}/`)
  openBrowser(`http://localhost:${port1}/`)
  openBrowser(`http://localhost:${port2}/`)

  const exitCode = await Promise.race([
    new Promise((resolve) => child1.on('exit', resolve)),
    new Promise((resolve) => child2.on('exit', resolve))
  ])

  shutdown()
  process.exit(typeof exitCode === 'number' ? exitCode : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
