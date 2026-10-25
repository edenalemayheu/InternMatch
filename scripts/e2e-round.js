#!/usr/bin/env node
const { once } = require('node:events');

const args = new Set(process.argv.slice(2));
const unknown = [...args].filter(arg => !['--fake', '--reset', '--help'].includes(arg));
if (unknown.length) {
  console.error(`FAIL arguments — unknown option(s): ${unknown.join(', ')}`);
  console.error('Usage: node scripts/e2e-round.js [--reset] [--fake]');
  process.exit(2);
}
if (args.has('--help')) {
  console.log('Usage: node scripts/e2e-round.js [--reset] [--fake]');
  console.log('  --reset  Create a fresh ranking_open round before running the workflow.');
  console.log('  --fake   Run locally against the in-memory Supabase adapter.');
  process.exit(0);
}

const fakeMode = args.has('--fake');
const resetMode = args.has('--reset');
const rawApiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001/api';
const normalizedApiUrl = rawApiUrl.trim().replace(/\/+$/, '');
const apiUrlFromEnv = normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`;
const ADMIN = { email: 'admin@internmatch.demo', password: 'Admin123!' };
const COMPANIES = [1, 2].map(index => ({ email: `company${index}@internmatch.demo`, password: 'Company123!' }));
const STUDENTS = [1, 2, 3, 4].map(index => ({ email: `student${index}@internmatch.demo`, password: 'Student123!' }));

class WorkflowError extends Error {
  constructor(message, responseBody) {
    super(responseBody === undefined ? message : `${message}\nResponse body:\n${formatBody(responseBody)}`);
    this.name = 'WorkflowError';
  }
}

let activeStep = null;

function formatBody(body) {
  if (typeof body === 'string') return body || '<empty response body>';
  try { return JSON.stringify(body, null, 2); } catch { return String(body); }
}

function expect(condition, message, body) {
  if (!condition) {
    const error = new WorkflowError(message, body);
    if (!activeStep) {
      report(false, 'response validation');
      console.error(error.message);
    }
    throw error;
  }
}

function report(pass, name, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function step(name, action) {
  activeStep = name;
  try {
    const result = await action();
    report(true, name, typeof result === 'string' ? result : '');
    return result;
  } catch (error) {
    report(false, name);
    console.error(error?.message || String(error));
    throw error;
  } finally {
    activeStep = null;
  }
}

async function httpCall(apiUrl, method, path, { token, body } = {}) {
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw new WorkflowError(`API_UNREACHABLE ${apiUrl} (${method} ${path}): ${error.message}`);
  }
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }
  if (!response.ok) {
    const error = new WorkflowError(`${method} ${path} returned HTTP ${response.status}`, data ?? text);
    error.status = response.status;
    error.responseBody = data ?? text;
    throw error;
  }
  if (data === null && text) throw new WorkflowError(`${method} ${path} returned non-JSON content`, text);
  return data;
}

function fakeFixture() {
  const userIds = {
    admin: '10000000-0000-4000-8000-000000000001',
    company1: '10000000-0000-4000-8000-000000000002',
    company2: '10000000-0000-4000-8000-000000000003',
    student1: '10000000-0000-4000-8000-000000000004',
    student2: '10000000-0000-4000-8000-000000000005',
    student3: '10000000-0000-4000-8000-000000000006',
    student4: '10000000-0000-4000-8000-000000000007',
  };
  const companyIds = ['30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002'];
  const studentIds = ['20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004'];
  const roundId = '40000000-0000-4000-8000-000000000001';
  const users = [
    { id: userIds.admin, email: ADMIN.email, role: 'student', is_admin: true },
    ...COMPANIES.map((account, index) => ({ id: userIds[`company${index + 1}`], email: account.email, role: 'company', is_admin: false })),
    ...STUDENTS.map((account, index) => ({ id: userIds[`student${index + 1}`], email: account.email, role: 'student', is_admin: false })),
  ];
  const accounts = Object.fromEntries([
    { ...ADMIN, user: { id: userIds.admin, email: ADMIN.email } },
    ...COMPANIES.map((account, index) => ({ ...account, user: { id: userIds[`company${index + 1}`], email: account.email } })),
    ...STUDENTS.map((account, index) => ({ ...account, user: { id: userIds[`student${index + 1}`], email: account.email } })),
  ].map(account => [account.email, account]));
  const students = STUDENTS.map((account, index) => ({
    id: studentIds[index], user_id: userIds[`student${index + 1}`], full_name: `Demo Student ${index + 1}`,
    department: index % 2 ? 'Data Science' : 'Computer Science', year: '3rd year', skills: ['React', 'Node.js'],
    portfolio_url: null, availability: 'Full-time summer', contact_email: account.email,
  }));
  const companies = COMPANIES.map((account, index) => ({
    id: companyIds[index], user_id: userIds[`company${index + 1}`], company_name: `Demo Company ${index + 1}`,
    industry: 'Software', contact_person: `Recruiter ${index + 1}`,
  }));
  const postings = companyIds.map((company_id, index) => ({
    id: `50000000-0000-4000-8000-00000000000${index + 1}`, company_id, round_id: roundId,
    title: `Demo Internship ${index + 1}`, required_department: '', required_skills: ['React'], capacity: 2,
    is_open: true, created_at: new Date(Date.now() + index).toISOString(),
  }));
  return {
    userIds,
    clientOptions: {
      tables: {
        users, students, companies,
        rounds: [{ id: roundId, label: 'Fake E2E Round', phase: 'ranking_open', created_at: new Date().toISOString() }],
        postings,
      },
      accounts,
    },
  };
}

async function startFakeBackend() {
  process.env.NODE_ENV = 'test';
  process.env.VERCEL = '1';
  process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
  const { createFakeSupabase } = await import('../backend/src/db/fakeSupabase.js');
  const { clientOptions } = fakeFixture();
  const adapter = await import('../backend/src/db/supabaseClient.js');
  adapter.setSupabaseForTests(createFakeSupabase(clientOptions));
  const { default: app } = await import('../backend/src/app.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, apiUrl: `http://127.0.0.1:${server.address().port}/api` };
}

async function runWorkflow(apiUrl) {
  const health = await step('backend reachable: GET /health', () => httpCall(apiUrl, 'GET', '/health'));
  expect(health?.ok === true, 'Health endpoint did not return { ok: true }', health);

  const adminResponse = await step('admin login', () => httpCall(apiUrl, 'POST', '/auth/login', { body: ADMIN }));
  const adminToken = adminResponse?.token;
  expect(typeof adminToken === 'string' && adminToken.length > 0, 'Admin login response did not include a token', adminResponse);

  let round;
  if (resetMode) {
    const label = `E2E ${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const created = await step('reset: create a fresh ranking_open round', () => httpCall(apiUrl, 'POST', '/admin/rounds', { token: adminToken, body: { label } }));
    round = created?.round;
    expect(round?.phase === 'ranking_open', 'Fresh round did not start in ranking_open', created);
  } else {
    const current = await step('read active round and verify ranking_open', async () => {
      let response;
      try { response = await httpCall(apiUrl, 'GET', '/rounds/current'); }
      catch (error) {
        if (error.status === 404) throw new WorkflowError('No ranking_open round exists. Use --reset to create a fresh round.', error.responseBody);
        throw error;
      }
      expect(response?.round?.phase === 'ranking_open', `No ranking_open round exists (found ${response?.round?.phase ?? 'no round'}). Re-run with --reset to create a fresh round.`, response);
      return response;
    });
    round = current.round;
  }
  expect(round?.id && round?.label, 'Active round response is missing id/label', round);
  console.log(`ROUND: ${round.label} (${round.id}) phase=${round.phase}`);

  const companyTokens = [];
  for (const [index, account] of COMPANIES.entries()) {
    const response = await step(`company ${index + 1} login (${account.email})`, () => httpCall(apiUrl, 'POST', '/auth/login', { body: account }));
    expect(response?.token, `Company ${index + 1} login response did not include a token`, response);
    companyTokens.push(response.token);
  }
  const studentTokens = [];
  for (const [index, account] of STUDENTS.entries()) {
    const response = await step(`student ${index + 1} login (${account.email})`, () => httpCall(apiUrl, 'POST', '/auth/login', { body: account }));
    expect(response?.token, `Student ${index + 1} login response did not include a token`, response);
    studentTokens.push(response.token);
  }

  const companyPostings = [];
  for (const [index, token] of companyTokens.entries()) {
    const postings = await step(`company ${index + 1} prepares an open posting`, async () => {
      const mine = await httpCall(apiUrl, 'GET', '/postings/mine', { token });
      expect(Array.isArray(mine?.postings), `Company ${index + 1} posting list is missing`, mine);
      let open = mine.postings.filter(posting => posting.is_open !== false);
      if (open.length === 0) {
        const created = await httpCall(apiUrl, 'POST', '/postings', {
          token,
          body: { title: `E2E Internship ${index + 1}`, required_department: '', required_skills: ['React'], capacity: 2 },
        });
        expect(created?.posting?.id, `Company ${index + 1} did not receive its created posting`, created);
        open = [created.posting];
      }
      return open;
    });
    for (const posting of postings) companyPostings.push({ posting, token, companyIndex: index + 1 });
  }
  expect(companyPostings.length >= 2, 'No open postings are available for the demo companies', companyPostings);

  const allResponse = await step('load open postings for student rankings', () => httpCall(apiUrl, 'GET', '/postings?all=true', { token: studentTokens[0] }));
  const allPostings = allResponse?.allPostings;
  expect(Array.isArray(allPostings) && allPostings.length > 0, 'No open postings are available to rank', allResponse);
  const postingIds = allPostings.map(posting => posting.id);
  expect(postingIds.every(id => typeof id === 'string'), 'Posting list contains an invalid ID', allResponse);
  for (const posting of companyPostings) {
    expect(postingIds.includes(posting.posting.id), `Open posting ${posting.posting.id} is missing from student browse results`, allResponse);
  }

  for (const [index, token] of studentTokens.entries()) {
    const result = await step(`student ${index + 1} submits ranking`, () => httpCall(apiUrl, 'POST', '/rankings', { token, body: { ordered_posting_ids: postingIds } }));
    expect(result?.ok === true, `Student ${index + 1} ranking was not accepted`, result);
  }

  async function advance(expectedPhase) {
    const response = await httpCall(apiUrl, 'POST', '/admin/rounds/advance-phase', { token: adminToken });
    expect(response?.round?.phase === expectedPhase, `Admin phase advance expected ${expectedPhase}`, response);
    return response;
  }
  for (const phase of ['ranking_locked', 'shortlisting']) {
    const result = await step(`admin advances round to ${phase}`, () => advance(phase));
    round = result.round;
  }

  const companyApplicants = [];
  for (const item of companyPostings) {
    const applicantsResponse = await step(`company ${item.companyIndex} loads applicants for ${item.posting.title}`, () => httpCall(apiUrl, 'GET', `/postings/${item.posting.id}/applicants`, { token: item.token }));
    expect(Array.isArray(applicantsResponse?.applicants) && applicantsResponse.applicants.length > 0, `Posting ${item.posting.title} has no applicants; refusing to skip shortlist/rank steps`, applicantsResponse);
    companyApplicants.push({ ...item, applicants: applicantsResponse.applicants });
    for (const student of applicantsResponse.applicants) {
      await step(`company ${item.companyIndex} shortlists ${student.full_name} for ${item.posting.title}`, () => httpCall(apiUrl, 'PATCH', `/shortlists/${item.posting.id}/${student.id}`, { token: item.token, body: { shortlist_status: 'shortlisted' } }));
    }
  }

  for (const phase of ['shortlist_locked', 'interviewing', 'company_ranking']) {
    const result = await step(`admin advances round to ${phase}`, () => advance(phase));
    round = result.round;
  }
  for (const item of companyApplicants) {
    const rankedIds = item.applicants.map(student => student.id);
    const result = await step(`company ${item.companyIndex} submits ranking for ${item.posting.title}`, () => httpCall(apiUrl, 'POST', '/company-rankings', {
      token: item.token,
      body: { posting_id: item.posting.id, ordered_student_ids: rankedIds },
    }));
    expect(result?.ok === true, `Company ranking for ${item.posting.title} was not accepted`, result);
  }

  let phaseResult = await step('admin locks company rankings', () => advance('company_locked'));
  round = phaseResult.round;
  const matchingResult = await step('admin runs matching and persists results', async () => {
    const result = await httpCall(apiUrl, 'POST', '/admin/rounds/run-matching', { token: adminToken });
    expect(Array.isArray(result?.matched), 'Matching response is missing matched results', result);
    expect(result.matched.length > 0, 'Matching completed with zero matches; refusing to report a successful round', result);
    return result;
  });
  phaseResult = await step('admin marks the round matched', () => advance('matched'));
  round = phaseResult.round;
  phaseResult = await step('admin reveals results', () => advance('revealed'));
  round = phaseResult.round;

  const studentResults = [];
  for (const [index, token] of studentTokens.entries()) {
    const result = await step(`student ${index + 1} reads revealed result`, () => httpCall(apiUrl, 'GET', '/matches/me', { token }));
    expect(Object.hasOwn(result || {}, 'match'), `Student ${index + 1} result response is missing match`, result);
    studentResults.push(result);
  }
  const companyResults = [];
  for (const [index, token] of companyTokens.entries()) {
    const result = await step(`company ${index + 1} reads revealed matches`, () => httpCall(apiUrl, 'GET', '/matches/me', { token }));
    expect(Array.isArray(result?.matches), `Company ${index + 1} result response is missing matches`, result);
    companyResults.push(result);
  }
  await step('verify matched rows persisted and are visible to both sides', () => {
    const studentMatchCount = studentResults.filter(result => result.match).length;
    const companyMatchCount = companyResults.reduce((count, result) => count + result.matches.length, 0);
    const body = { matchingResult, studentResults, companyResults };
    expect(studentMatchCount === matchingResult.matched.length, 'Persisted student results do not match the match-run summary', body);
    expect(companyMatchCount === matchingResult.matched.length, 'Persisted company results do not match the match-run summary', body);
    return `${matchingResult.matched.length} persisted match(es)`;
  });

  report(true, 'E2E round completed', round.phase);
  console.log('MATCH RESULTS');
  console.log(formatBody({ round: { id: round.id, label: round.label, phase: round.phase }, matchingRun: matchingResult, studentResults, companyResults }));
}

async function main() {
  let server;
  try {
    let apiUrl = apiUrlFromEnv;
    if (fakeMode) {
      const fake = await startFakeBackend();
      server = fake.server;
      apiUrl = fake.apiUrl;
    }
    console.log(`API URL: ${apiUrl}${fakeMode ? ' (in-memory fake backend)' : ''}`);
    if (resetMode && fakeMode) console.log('PASS reset: seeded fake demo accounts/profiles are loaded in the in-memory database');
    await runWorkflow(apiUrl);
  } catch (error) {
    console.error(`FAIL E2E workflow terminated; remaining steps were not run: ${error?.message || String(error)}`);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

main();
