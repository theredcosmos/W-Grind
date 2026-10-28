// `npm run dev`: start the API server (../server) next to Vite so sign-in and sync work locally.
// `npm run dev:web` still runs Vite alone.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = join(appDir, '..', 'server');
const children = [];
// The API always gets its own port; a PORT meant for Vite (set by some launchers) must not leak into it.
const API_PORT = Number(process.env.API_PORT) || 5000;

const portInUse = (port) => new Promise((resolve) => {
  const sock = createConnection({ port, host: '127.0.0.1' });
  sock.once('connect', () => { sock.destroy(); resolve(true); });
  sock.once('error', () => resolve(false));
});

if (!existsSync(join(serverDir, 'node_modules'))) {
  console.warn('[dev] server/node_modules missing — run `npm install` in server/ to enable sign-in. Starting Vite only.');
} else if (await portInUse(API_PORT)) {
  console.log(`[dev] Something is already listening on :${API_PORT} — assuming it is the API server.`);
} else {
  children.push(spawn(process.execPath, ['index.js'], { cwd: serverDir, stdio: 'inherit', env: { ...process.env, PORT: String(API_PORT) } }));
}

const vite = spawn(process.execPath, [join(appDir, 'node_modules', 'vite', 'bin', 'vite.js'), ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: 'inherit',
});
children.push(vite);

const stop = () => children.forEach((c) => c.exitCode === null && c.kill());
vite.on('exit', (code) => { stop(); process.exit(code ?? 0); });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
