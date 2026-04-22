import { copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const isolatedRoot = path.join(projectRoot, '.dual-dev');
const runRoot = path.join(isolatedRoot, `run-${Date.now()}-${process.pid}`);
const workdirs = [path.join(runRoot, 'port-3000'), path.join(runRoot, 'port-3001')];
const preferredPorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPorts() {
  const ports = [];

  for (const port of preferredPorts) {
    if (await isPortFree(port)) {
      ports.push(port);
      if (ports.length === 2) {
        return ports;
      }
    }
  }

  return ports;
}

async function ensureFile(source, destination) {
  try {
    await copyFile(source, destination);
  } catch {
    // Ignore missing optional files.
  }
}

async function prepareWorkdir(workdir) {
  await mkdir(isolatedRoot, { recursive: true });
  await mkdir(workdir, { recursive: true });

  const entriesToCopy = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'index.html',
    '.env',
    '.env.local',
    '.env.example',
    'README.md',
    'hero-premium-consulting.svg',
    'ui-concept-1-desktop.svg',
    'ui-concept-2-mobile.svg',
    'ui-concept-3-premium.svg',
    'src',
    'public',
    'api',
  ];

  for (const entry of entriesToCopy) {
    const source = path.join(projectRoot, entry);
    const destination = path.join(workdir, entry);

    try {
      await cp(source, destination, {
        recursive: true,
        force: true,
        errorOnExist: false,
        filter: (currentSource) => {
          const normalized = currentSource.replaceAll(path.sep, '/');
          return !normalized.includes('/node_modules/') && !normalized.includes('/.next/') && !normalized.includes('/.git/');
        },
      });
    } catch {
      // Optional folders or files can be absent.
    }
  }

  await ensureFile(path.join(projectRoot, '.env'), path.join(workdir, '.env'));
  await ensureFile(path.join(projectRoot, '.env.local'), path.join(workdir, '.env.local'));
  await ensureFile(path.join(projectRoot, '.env.example'), path.join(workdir, '.env.example'));
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', url], {
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    }).unref();
  }
}

function spawnDevServer(workdir, port) {
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: workdir,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
    shell: process.platform === 'win32',
  });

  child.on('error', (error) => {
    console.error(`Failed to start dev server on port ${port}:`, error);
  });

  return child;
}

function waitForServer(port, timeoutMs = 60000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 1000 }, (res) => {
        res.resume();

        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`));
          return;
        }

        setTimeout(tick, 1000);
      });

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`));
        } else {
          setTimeout(tick, 1000);
        }
      });
    };

    tick();
  });
}

async function main() {
  const ports = await pickPorts();

  if (ports.length < 2) {
    console.error('No available pair of ports found between 3000 and 3010.');
    process.exit(1);
  }

  const [port1, port2] = ports;
  console.log(`Using ports ${port1} and ${port2}.`);

  await Promise.all(workdirs.map(prepareWorkdir));

  const children = [
    spawnDevServer(workdirs[0], port1),
    spawnDevServer(workdirs[1], port2),
  ];

  const shutdown = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGINT');
      }
    }
  };

  process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
  });

  await Promise.all([waitForServer(port1), waitForServer(port2)]);
  console.log(`Servers are running at http://localhost:${port1}/ and http://localhost:${port2}/`);
  openBrowser(`http://localhost:${port1}/`);
  openBrowser(`http://localhost:${port2}/`);

  const exitCode = await Promise.race(children.map((child) => new Promise((resolve) => child.on('exit', resolve))));

  shutdown();
  process.exit(typeof exitCode === 'number' ? exitCode : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
