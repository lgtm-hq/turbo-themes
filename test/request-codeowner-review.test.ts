import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';

const script = join(__dirname, '../scripts/ci/request-codeowner-review.sh');
let sandbox: string;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'codeowner-review-'));
  mkdirSync(join(sandbox, '.github'));
  writeFileSync(join(sandbox, '.github/CODEOWNERS'), '* @TurboCoder13 @OtherOwner\n');
  writeFileSync(join(sandbox, 'calls.jsonl'), '');
  writeFileSync(
    join(sandbox, 'gh'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync('calls.jsonl', JSON.stringify(args) + '\\n');
const state = JSON.parse(fs.readFileSync('state.json', 'utf8'));
const fail = message => { console.error(message); process.exit(1); };
if (args[0] !== 'api') fail('combined GraphQL edit is not supported');
const method = args[args.indexOf('--method') + 1];
const endpoint = args[1];
if (method === 'GET' && endpoint === 'repos/{owner}/{repo}/pulls/1245') {
  state.reads = (state.reads || 0) + 1;
  fs.writeFileSync('state.json', JSON.stringify(state));
  if (state.readFailure === state.reads) fail('read failed');
  console.log(state.emptyRead === state.reads ? ''
    : state.malformed || state.malformedRead === state.reads ? '{}' : JSON.stringify(state));
} else if (method === 'POST') {
  const field = endpoint.endsWith('/requested_reviewers') ? 'reviewers' : 'assignees';
  const expected = field === 'reviewers'
    ? 'repos/{owner}/{repo}/pulls/1245/requested_reviewers'
    : 'repos/{owner}/{repo}/issues/1245/assignees';
  if (endpoint !== expected || args.length !== 6 || args[4] !== '-f'
      || args[5] !== field + '[]=TurboCoder13') fail('unexpected mutation');
  if (state.failure !== field + '-before' && state.noEffect !== field) {
    state[field === 'reviewers' ? 'requested_reviewers' : 'assignees'].push({login: 'TurboCoder13'});
    fs.writeFileSync('state.json', JSON.stringify(state));
  }
  if (state.failure?.startsWith(field)) fail('mutation failed');
  console.log('{}');
} else fail('unexpected gh invocation');
`,
  );
  chmodSync(join(sandbox, 'gh'), 0o755);
});

afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

function run(state: Record<string, unknown> = {}, pr = '1245') {
  writeFileSync(
    join(sandbox, 'state.json'),
    JSON.stringify({ requested_reviewers: [], assignees: [], ...state }),
  );
  return spawnSync('bash', [script], {
    cwd: sandbox,
    encoding: 'utf8',
    timeout: 10_000,
    env: { ...process.env, PATH: `${sandbox}:${process.env.PATH}`, PR_NUMBER: pr },
  });
}

function calls(): string[][] {
  return readFileSync(join(sandbox, 'calls.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const owner = [{ login: 'TurboCoder13' }];

test('already requested and assigned is a verified no-op, not a combined edit', () => {
  const result = run({ requested_reviewers: owner, assignees: owner });
  expect(result.status, result.stderr).toBe(0);
  expect(calls().every((args) => args.includes('GET'))).toBe(true);
  expect(calls().length).toBeGreaterThan(0);
});

test('adds only the first catch-all owner through both narrow REST endpoints', () => {
  const result = run();
  expect(result.status, result.stderr).toBe(0);
  expect(calls().filter((args) => args.includes('POST')).map((args) => args[5])).toEqual([
    'reviewers[]=TurboCoder13',
    'assignees[]=TurboCoder13',
  ]);
  // A second invocation must not re-request or reassign.
  const saved = JSON.parse(readFileSync(join(sandbox, 'state.json'), 'utf8'));
  writeFileSync(join(sandbox, 'calls.jsonl'), '');
  expect(run(saved).status).toBe(0);
  expect(calls().filter((args) => args.includes('POST'))).toEqual([]);
});

test.each(['reviewers', 'assignees'])('skips the satisfied %s independently', (field) => {
  const state = field === 'reviewers' ? { requested_reviewers: owner } : { assignees: owner };
  const result = run(state);
  expect(result.status, result.stderr).toBe(0);
  const mutations = calls().filter((args) => args.includes('POST'));
  expect(mutations).toHaveLength(1);
  expect(mutations[0][5]).toBe(
    field === 'reviewers' ? 'assignees[]=TurboCoder13' : 'reviewers[]=TurboCoder13',
  );
});

test.each(['reviewers', 'assignees'])('reconciles %s error only after exact side effect readback', (field) => {
  const result = run({ failure: `${field}-after` });
  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toContain('Mutation error reconciled');
  expect(calls().filter((args) => args.includes('GET'))).toHaveLength(2);
});

test.each(['reviewers', 'assignees'])('fails on unmet %s after an API error without retry', (field) => {
  const result = run({ failure: `${field}-before` });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('postconditions unmet');
  expect(result.stderr).not.toContain('Mutation error reconciled');
  expect(calls().filter((args) => args.includes('POST'))).toHaveLength(2);
});

test.each(['reviewers', 'assignees'])('fails on silent %s mutation without the required state', (field) => {
  const result = run({ noEffect: field });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('postconditions unmet');
});

test.each([1, 2])('fails closed when state read %s fails', (readFailure) => {
  const result = run({ readFailure });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('read failed');
  if (readFailure === 1) expect(calls()).toHaveLength(1);
});

test('fails closed before writes on malformed state', () => {
  expect(run({ malformed: true }).status).not.toBe(0);
  expect(calls().filter((args) => args.includes('POST'))).toEqual([]);
});

test('matches the same GitHub user regardless of login casing', () => {
  writeFileSync(join(sandbox, '.github/CODEOWNERS'), '* @turbocoder13\n');
  const result = run({ requested_reviewers: owner, assignees: owner });
  expect(result.status, result.stderr).toBe(0);
  expect(calls().filter((args) => args.includes('POST'))).toEqual([]);
});

test.each([1, 2])('fails closed on empty state read %s', (emptyRead) => {
  const result = run({ emptyRead });
  expect(result.status).not.toBe(0);
  if (emptyRead === 1) expect(calls()).toHaveLength(1);
});

test('fails closed on a malformed final read after successful writes', () => {
  const result = run({ malformedRead: 2 });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Cannot verify CODEOWNER postconditions');
});

test('another user never satisfies either CODEOWNER postcondition or gets removed', () => {
  const other = [{ login: 'OtherUser' }];
  const result = run({ requested_reviewers: other, assignees: other });
  expect(result.status, result.stderr).toBe(0);
  expect(calls().filter((args) => args.includes('POST'))).toHaveLength(2);
  const saved = JSON.parse(readFileSync(join(sandbox, 'state.json'), 'utf8'));
  expect(saved.requested_reviewers).toEqual([...other, ...owner]);
  expect(saved.assignees).toEqual([...other, ...owner]);
});

test.each(['reviewers', 'assignees'])('another user cannot reconcile ineffective %s mutation', (field) => {
  const other = [{ login: 'OtherUser' }];
  const state = field === 'reviewers'
    ? { requested_reviewers: other, assignees: owner }
    : { requested_reviewers: owner, assignees: other };
  const result = run({ ...state, noEffect: field });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('postconditions unmet');
  expect(calls().filter((args) => args.includes('POST'))).toHaveLength(1);
});

test('no owner is a no-op', () => {
  writeFileSync(join(sandbox, '.github/CODEOWNERS'), '# no catch-all owner\n/src/ @Someone\n');
  expect(run().status).toBe(0);
  expect(calls()).toEqual([]);
});

test('missing PR number fails before any API request', () => {
  const result = run({}, '');
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('PR_NUMBER is required');
  expect(calls()).toEqual([]);
});
