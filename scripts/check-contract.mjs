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
import { spawnSync } from 'node:child_process';
import { handlerFailure, inspectRegistrations } from './contract-route-inspector.mjs';

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
const handlerFailures = [];
if (existsSync(routesDir)) {
  for (const f of readdirSync(routesDir).filter((x) => x.endsWith('.js'))) {
    const prefix = f.startsWith('admin.') ? '/api/admin' : '/api';
    const src = readFileSync(join(routesDir, f), 'utf8');
    const registrations = inspectRegistrations(src, /\brouter\.(get|post|patch|put|delete)\s*\(/gi, prefix);
    for (const route of registrations) {
      if (handlerFailure(route, src)) handlerFailures.push(`${f}: ${route.method} ${route.path || '(dynamic path)'} — ${handlerFailure(route, src)}`);
      if (route.path) implemented.set(norm(route.method, route.path), `${route.method} ${route.path}`);
    }
  }
}

/* routes registered directly on the app in app.js, e.g. app.get('/api/health', ...) */
const appFile = join(ROOT, 'backend/src/app.js');
if (existsSync(appFile)) {
  const src = readFileSync(appFile, 'utf8');
  const registrations = inspectRegistrations(src, /\bapp\.(get|post|patch|put|delete)\s*\(/gi, '');
  for (const route of registrations) {
    if (route.path && route.path.startsWith('/api')) {
      if (handlerFailure(route, src)) handlerFailures.push(`app.js: ${route.method} ${route.path} — ${handlerFailure(route, src)}`);
      implemented.set(norm(route.method, route.path), `${route.method} ${route.path}`);
    }
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
console.log(`Backend handlers: ${implemented.size - handlerFailures.length} real callbacks`);
if (handlerFailures.length) { console.log(`\nFAIL: missing or stub backend handlers (${handlerFailures.length})`); handlerFailures.forEach(value => console.log(`  - ${value}`)); }
if (frontendUndocumented.length) show('FAIL: frontend calls these but the docs do not describe them', frontendUndocumented, called);
if (backendUndocumented.length)  show('FAIL: backend implements these but the docs do not describe them', backendUndocumented, implemented);
if (notCalled.length)            show('Info: documented but not called by the frontend yet', notCalled, documented);
if (notImplemented.length)       show('FAIL: documented but not implemented in the backend', notImplemented, documented);

let smokeFailed = false;
if (handlerFailures.length === 0 && notImplemented.length === 0) {
  const routeTests = readdirSync(routesDir).filter(name => name.endsWith('.test.js')).map(name => join(routesDir, name));
  const smoke = spawnSync(process.execPath, ['--test', ...routeTests], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  if (smoke.status !== 0) {
    smokeFailed = true;
    console.error('\nFAIL: in-memory backend route tests failed; registered handlers did not pass executable HTTP checks.');
    console.error((smoke.stdout + smoke.stderr).split('\n').slice(-50).join('\n'));
  } else {
    const summary = (smoke.stdout + smoke.stderr).match(/ℹ tests (\d+)/);
    console.log(`In-memory backend HTTP handler tests passed: ${summary?.[1] || 'route suite'} tests`);
  }
} else if (notImplemented.length) {
  console.log('\nIn-memory backend HTTP tests skipped until every documented route has a backend handler.');
}
const failed = frontendUndocumented.length + backendUndocumented.length + notImplemented.length + handlerFailures.length + Number(smokeFailed);
console.log(failed ? `\nContract check FAILED (${failed} problem${failed > 1 ? 's' : ''}).` : '\nContract check passed: documented routes, real handlers, frontend calls and executable backend HTTP checks are aligned.');
process.exit(failed ? 1 : 0);
