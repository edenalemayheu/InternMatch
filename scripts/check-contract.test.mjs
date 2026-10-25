import test from 'node:test';
import assert from 'node:assert/strict';
import { handlerFailure, hasRealHandler, inspectRegistrations } from './contract-route-inspector.mjs';

test('inspects registered route callbacks, not method declarations alone', () => {
  const [route] = inspectRegistrations("router.get('/health', (req, res) => res.json({ ok: true }));");
  assert.equal(route.path, '/api/health');
  assert.equal(handlerFailure(route, ''), null);
});

test('ignores commented-out route registrations', () => {
  assert.deepEqual(inspectRegistrations("// router.get('/removed', (req, res) => res.json({}));\nrouter.get('/live', (req, res) => res.json({}));").map(route => route.path), ['/api/live']);
});

test('rejects missing, empty, placeholder, and unhandled callbacks', () => {
  const samples = [
    "router.get('/empty');",
    "router.get('/empty', (req, res) => {});",
    "router.get('/stub', (req, res) => res.status(501).end());",
    "router.get('/stub', async (req, res) => { throw new Error('Not implemented'); });",
  ];
  for (const source of samples) {
    const [route] = inspectRegistrations(source);
    assert.notEqual(handlerFailure(route, source), null, source);
  }
});

test('accepts a named handler factory only when its implementation responds', () => {
  const source = "function list() { return async (req, res) => res.json({ items: [] }); } router.get('/items', list());";
  const [route] = inspectRegistrations(source);
  assert.equal(hasRealHandler(route, source), true);
});
