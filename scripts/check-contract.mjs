#!/usr/bin/env node
/**
 * Contract check: keeps frontend, docs and backend describing the same API.
 *
 *   node scripts/check-contract.mjs
 *
 * FAILS (exit 1) when the frontend calls an endpoint that docs/api/endpoints.md
 * does not document, or when the backend implements one the docs do not.
 * REPORTS (no failure) which documented endpoints are not yet called by the
 * frontend or not yet implemented in the backend. That list is the build
 * progress for the backend.
 *
 * Run from the repository root.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const norm = (method, path) =>
  `${method.toUpperCase()} ${path.replace(/\/+$/, '').replace(/:[A-Za-z_]+/g, ':p') || '/'}`;

/* 1. Documented endpoints: headings like  ### `GET /api/postings/:id` */
const docsFile = join(ROOT, 'docs/api/endpoints.md');
if (!existsSync(docsFile)) { console.error('Missing docs/api/endpoints.md. Run from the repository root.'); process.exit(2); }
const documented = new Map();
for (const m of readFileSync(docsFile, 'utf8').matchAll(/^###\s+`(GET|POST|PATCH|PUT|DELETE)\s+(\/api\/[^`\s?]*)`/gm)) {
  documented.set(norm(m[1], m[2]), `${m[1]} ${m[2]}`);
}

/* 2. Endpoints the frontend calls in real (non-mock) mode */
const clientFile = join(ROOT, 'frontend/src/lib/apiClient.js');
const called = new Map();
// apiFetch() is the authenticated call; request() is the plain call used by login, signup, refresh and logout.
for (const m of readFileSync(clientFile, 'utf8').matchAll(/\b(?:apiFetch|request)\(\s*'(GET|POST|PATCH|PUT|DELETE)'\s*,\s*(`[^`]*`|'[^']*')/g)) {
  let p = m[2].slice(1, -1)
    .replace(/\$\{[^}]*\?[^}]*\}/g, '')   // optional query suffix such as ${all ? '?all=true' : ''}
    .replace(/\$\{[^}]*\}/g, ':p')        // path parameters
    .replace(/\?.*$/, '');
  called.set(norm(m[1], '/api' + p), `${m[1]} /api${p}`);
}

/* 3. Endpoints the backend implements */
const routesDir = join(ROOT, 'backend/src/routes');
const implemented = new Map();
if (existsSync(routesDir)) {
  for (const f of readdirSync(routesDir).filter((x) => x.endsWith('.js'))) {
    const prefix = f.startsWith('admin.') ? '/api/admin' : '/api';
    const src = readFileSync(join(routesDir, f), 'utf8')
      .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');   // ignore commented-out code
    for (const m of src.matchAll(/router\.(get|post|patch|put|delete)\(\s*['"`]([^'"`]*)['"`]/gi)) {
      implemented.set(norm(m[1], prefix + (m[2] === '/' ? '' : m[2])), `${m[1].toUpperCase()} ${prefix}${m[2]}`);
    }
  }
}

/* routes registered directly on the app in app.js, e.g. app.get('/api/health', ...) */
const appFile = join(ROOT, 'backend/src/app.js');
if (existsSync(appFile)) {
  for (const m of readFileSync(appFile, 'utf8').matchAll(/^\s*app\.(get|post|patch|put|delete)\(\s*['"`](\/api[^'"`]*)['"`]/gim)) {
    implemented.set(norm(m[1], m[2]), `${m[1].toUpperCase()} ${m[2]}`);
  }
}

const keys = (a, b) => [...a.keys()].filter((k) => !b.has(k));
const show = (title, list, map) => {
  console.log(`\n${title} (${list.length})`);
  list.forEach((k) => console.log('  - ' + map.get(k)));
};

const frontendUndocumented = keys(called, documented);
const backendUndocumented = keys(implemented, documented);
const notCalled = keys(documented, called);
const notImplemented = keys(documented, implemented);

console.log(`Documented: ${documented.size}   Frontend calls: ${called.size}   Backend routes: ${implemented.size}`);
if (frontendUndocumented.length) show('FAIL: frontend calls these but the docs do not describe them', frontendUndocumented, called);
if (backendUndocumented.length)  show('FAIL: backend implements these but the docs do not describe them', backendUndocumented, implemented);
if (notCalled.length)            show('Info: documented but not called by the frontend yet', notCalled, documented);
if (notImplemented.length)       show('Info: documented but not implemented in the backend yet', notImplemented, documented);

const failed = frontendUndocumented.length + backendUndocumented.length;
console.log(failed ? `\nContract check FAILED (${failed} mismatch${failed > 1 ? 'es' : ''}).` : '\nContract check passed: nothing the frontend calls or the backend serves is undocumented.');
process.exit(failed ? 1 : 0);
