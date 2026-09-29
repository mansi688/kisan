#!/usr/bin/env node
/**
 * One-command runner so nobody has to juggle two terminals, two `npm install`s
 * and a hand-copied .env:
 *
 *   npm run setup   install everything, create backend/.env, build the site, seed data
 *   npm start       (does whatever is missing from the above) then serve the WHOLE
 *                   website + API on http://localhost:4000 — one process, one port
 *   npm run dev     backend (auto-restart) + Vite dev server together, for editing code
 *   npm run seed    (re)run the seed step only
 *
 * Plain Node, no dependencies, works the same on Windows / macOS / Linux.
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');
const web = path.join(root, 'web');

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\n✖ "${cmd} ${args.join(' ')}" failed in ${path.relative(root, cwd) || '.'} (exit ${r.status}).`);
    process.exit(r.status || 1);
  }
}

function ensureEnv() {
  const env = path.join(backend, '.env');
  // A zero/near-zero-byte .env (from an interrupted copy, or a bad manual edit)
  // makes dotenv report "injected env (0)" and silently fall back to defaults —
  // treat it the same as missing.
  if (!fs.existsSync(env) || fs.statSync(env).size < 20) {
    fs.copyFileSync(path.join(backend, '.env.example'), env);
    console.log('• Created backend/.env from backend/.env.example');
  }
}

function ensureDeps(dir, marker) {
  if (!fs.existsSync(path.join(dir, 'node_modules', marker))) {
    console.log(`• Installing dependencies in ${path.relative(root, dir)}/ ...`);
    run('npm', ['install', '--no-audit', '--no-fund'], dir);
  }
}

function ensureBuild(force) {
  if (force || !fs.existsSync(path.join(web, 'dist', 'index.html'))) {
    ensureDeps(web, 'vite');
    console.log('• Building the website ...');
    run('npm', ['run', 'build'], web);
  }
}

function seed() {
  run('node', ['seed.js'], backend);
}

function banner(port) {
  console.log(`
────────────────────────────────────────────────────────────
 KisanUnnatti is starting.  Open:  http://localhost:${port}
   Farmer demo   9000000001 / Demo@123     (or use the Demo page)
   Admin         username: admin   (password: see README / ADMIN_PASSWORD)
────────────────────────────────────────────────────────────`);
}

const cmd = process.argv[2] || 'start';

if (cmd === 'setup') {
  ensureEnv();
  ensureDeps(backend, 'dotenv');
  ensureBuild(true);
  seed();
  console.log('\n✔ Setup complete. Start the site with:  npm start');
} else if (cmd === 'seed') {
  ensureEnv();
  ensureDeps(backend, 'dotenv');
  seed();
} else if (cmd === 'start') {
  ensureEnv();
  ensureDeps(backend, 'dotenv');
  ensureBuild(false);
  seed(); // idempotent: only fills collections that are empty
  banner(process.env.PORT || 4000);
  const child = spawn('node', ['server.js'], { cwd: backend, stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
} else if (cmd === 'dev') {
  ensureEnv();
  ensureDeps(backend, 'dotenv');
  ensureDeps(web, 'vite');
  seed();
  console.log('\nDev mode: API on http://localhost:4000, website (hot reload) on http://localhost:5173\n');
  const kids = [
    spawn('node', ['--watch', 'server.js'], { cwd: backend, stdio: 'inherit' }),
    spawn('npm', ['run', 'dev'], { cwd: web, stdio: 'inherit', shell: true })
  ];
  const stop = () => kids.forEach((k) => { try { k.kill(); } catch (_) {} });
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stop(); process.exit(0); });
  kids.forEach((k) => k.on('exit', () => { stop(); process.exit(0); }));
} else {
  console.error(`Unknown command "${cmd}". Use: setup | start | dev | seed`);
  process.exit(1);
}
