#!/usr/bin/env node
// Runs test files one at a time, measures each (wall seconds, tests, pass, fail), and keeps the timings.
//
//   node tools/test-run.mjs                     every tests/*.test.mjs, one at a time (the full suite of a round)
//   node tools/test-run.mjs --changed [base]    build, then the tests the changed paths touch (vs origin/main) + catalog/validate
//   node tools/test-run.mjs --slow [n]          the n (10) slowest files of the last timings, without running anything
//   node tools/test-run.mjs --plan [base]       print the files --changed would run and why, without running them
//   node tools/test-run.mjs tests/a.test.mjs …  these files
//
// Each file runs as one process (`node --test-reporter=tap <file>`); its wall seconds and peak memory (VmHWM) are kept
// in .test-timings.json (git-ignored; a file's last run replaces its entry). Several workers share the machine's
// memory: a file starts when its last peak + 600 MB (at least SKW_MIN_FREE_MB, default 2500) are free, and a file
// killed by SIGKILL (the memory killer) is run again alone, up to 4 times. A file killed on every try, or one that ran
// no test, FAILS ("not run"): a file that never ran is not a pass (review 2026-11-15, finding 1).
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIMINGS = join(REPO, '.test-timings.json');
const MIN_FREE = Number(process.env.SKW_MIN_FREE_MB ?? 2500);
const ALWAYS = ['tests/catalog.test.mjs', 'tests/validate.test.mjs', 'tests/repo.test.mjs'];

export const allTests = (repo = REPO) => readdirSync(join(repo, 'tests')).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => `tests/${f}`);

// The paths changed against a base: committed (base...HEAD), staged, unstaged and untracked.
export function changedPaths(base = 'origin/main', repo = REPO) {
  const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
  let mb = base;
  try { mb = git('merge-base', base, 'HEAD')[0]; } catch { /* base unknown: diff against it as given */ }
  return [...new Set([...git('diff', '--name-only', mb), ...git('ls-files', '--others', '--exclude-standard')])].sort();
}

// Generated files every build rewrites: a change in them alone says nothing about which world changed.
const GENERATED = /^docs\/(worlds\/(index\.json|vocab(-kinds)?\.json|COVERAGE\.md|JOINS\.md|LICENSES\.md|k\.attributes\/ASPECTS\.md)|gallery\.html)$|^(worker-log|worker-tasks|questions|CHANGELOG|PLAN)\.md$|^docs\/lessons\.md$/;

// The modules a file imports, transitively (static `from './x.mjs'` and `import('./x.mjs')`, relative paths only).
function importGraph(repo) {
  const cache = new Map();
  const deps = (file) => {
    if (cache.has(file)) return cache.get(file);
    const out = new Set();
    cache.set(file, out);
    let text = '';
    try { text = readFileSync(join(repo, file), 'utf8'); } catch { return out; }
    for (const [, rel] of text.matchAll(/(?:from\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const dep = join(dirname(file), rel).split('\\').join('/');
      out.add(dep);
      for (const d of deps(dep)) out.add(d);
    }
    return out;
  };
  return deps;
}

// Which test files a set of changed paths touches, with the reason for each. General, by names and imports, not by
// a table:
//  - a changed test file runs itself; a changed tests/<x>.questions.jsonl runs tests/questions.test.mjs;
//  - a changed module (.mjs under tools/) runs every test that imports it, directly or through other modules, and
//    the tests of every world whose shard headers name it as their script ("# script: tools/…");
//  - a path under docs/worlds/<world>/ touches the world <world>: the tests whose file name starts with the world's
//    id, every test that names the world (`k.actions/`, 'w.lang.en'), its questions, and the tests of the worlds
//    whose schema imports it;
//  - the catalog, validate and repository tests always run.
export function plan(paths, repo = REPO) {
  const tests = allTests(repo);
  const text = Object.fromEntries(tests.map((t) => [t, readFileSync(join(repo, t), 'utf8')]));
  const deps = importGraph(repo);
  const why = new Map();
  // tests/questions.test.mjs asks the questions of every world; touched only through some worlds, it asks only theirs
  // (SKW_WORLDS, see questions.test.mjs); `scope` null means every world
  const scope = new Map();
  const add = (t, r, world = null) => {
    if (!why.has(t)) why.set(t, []);
    if (!why.get(t).includes(r)) why.get(t).push(r);
    const s = scope.has(t) ? scope.get(t) : new Set();
    scope.set(t, s === null || world === null ? null : s.add(world));
  };
  const worlds = existsSync(join(repo, 'docs/worlds')) ? readdirSync(join(repo, 'docs/worlds')).filter((d) => /^[kw]\./.test(d)) : [];
  const importers = (w) => worlds.filter((o) => {
    const p = join(repo, 'docs/worlds', o, 'schema.sop');
    if (o === w || !existsSync(p)) return false;
    const head = readFileSync(p, 'utf8').split('\n').find((l) => l.includes('core.module')) ?? '';
    return new RegExp(`imports=\\S*\\b${w.replace(/\./g, '\\.')}\\b`).test(head);
  });
  const touchWorld = (w, reason) => {
    const re = new RegExp(`${w.replace(/\./g, '\\.')}(?![\\w.])|${w.replace(/\./g, '\\.')}/`);
    for (const t of tests) if (basename(t).startsWith(`${w}.`) || re.test(text[t])) add(t, reason);
    if (existsSync(join(repo, `tests/${w}.questions.jsonl`))) add('tests/questions.test.mjs', reason, w);
  };
  for (const p of paths) {
    if (GENERATED.test(p)) continue;
    if (/^tests\/.*\.test\.mjs$/.test(p) && tests.includes(p)) { add(p, 'changed'); continue; }
    if (/^tests\/.*\.questions\.jsonl$/.test(p)) { add('tests/questions.test.mjs', p, basename(p).replace(/\.questions\.jsonl$/, '')); continue; }
    const wm = p.match(/^docs\/worlds\/([kw]\.[^/]+)\//);
    // a page computed from every world (COVERAGE.md, ASPECTS.md, JOINS.md) goes stale with a change of any world: the
    // tests that recompute such a page run for every world change
    if (wm) for (const t of tests) if (/(COVERAGE|ASPECTS|JOINS[\w-]*)\.md/.test(text[t])) add(t, `${p} (a page of every world)`);
    if (wm) {
      touchWorld(wm[1], p);
      for (const o of importers(wm[1])) touchWorld(o, `${p} (imported by ${o})`);
      continue;
    }
    if (/^tools\/.*\.mjs$/.test(p)) {
      for (const t of tests) if (deps(t).has(p)) add(t, p);
      for (const w of worlds) {
        const dir = join(repo, 'docs/worlds', w);
        const files = [join(dir, 'schema.sop'), ...(existsSync(join(dir, 'shards')) ? readdirSync(join(dir, 'shards')).map((f) => join(dir, 'shards', f)) : [])];
        if (files.some((f) => readFileSync(f, 'utf8').slice(0, 1500).includes(p))) touchWorld(w, `${p} (writes ${w})`);
      }
    }
  }
  for (const t of ALWAYS) add(t, 'always');
  why.scope = scope;
  return why;
}

const freeMb = () => Number((readFileSync('/proc/meminfo', 'utf8').match(/MemAvailable:\s+(\d+)/) ?? [0, 1e9])[1]) / 1024;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// A file starts when the memory it took last time (its peak, kept in the timings) and a margin are free.
async function waitForMemory(need = 0) { const want = Math.max(MIN_FREE, need + 600); while (freeMb() < want) await sleep(3000); }

// The file runs as one process (node:test runs its tests in place), so its peak memory is its own VmHWM.
const peakOf = (pid) => { try { return Number((readFileSync(`/proc/${pid}/status`, 'utf8').match(/VmHWM:\s+(\d+)/) ?? [0, 0])[1]) / 1024; } catch { return 0; } };
function runOnce(file, env = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, ['--test-reporter=tap', file], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], env: { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT')), ...env } }); // under node --test the child would report to the parent and print no counts
    let out = '', mb = 0;
    const poll = setInterval(() => { mb = Math.max(mb, peakOf(child.pid)); }, 200);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code, signal) => {
      clearInterval(poll);
      const n = (k) => Number((out.match(new RegExp(`^# ${k} (\\d+)`, 'm')) ?? [0, 0])[1]);
      resolve({ file, seconds: (Date.now() - t0) / 1000, mb: Math.round(mb), code, signal, killed: signal === 'SIGKILL' || /SIGKILL/.test(out), tests: n('tests'), pass: n('pass'), fail: n('fail'), skipped: n('skipped'), out });
    });
  });
}

// The verdict of one run: null when it passed, else why it failed. A run killed by a signal has code null and fail 0,
// and a file that ran no test has fail 0 too: both are "not run", never a pass.
export function verdict(r) {
  if (r.killed || r.signal) return `not run (killed by ${r.signal ?? 'SIGKILL'}${r.tries > 1 ? ` on all ${r.tries} tries` : ''})`;
  if (r.fail) return `${r.fail} failing`;
  if (r.code) return `exit code ${r.code}`;
  if (!r.tests) return 'not run (0 tests)';
  return null;
}

export async function runFiles(files, { log = console.log, envOf = () => ({}), tries = 5, keep = true, pause = 5000 } = {}) {
  const timings = existsSync(TIMINGS) ? JSON.parse(readFileSync(TIMINGS, 'utf8')) : {};
  const results = [];
  for (const f of files) {
    let r;
    for (let i = 0; i < tries; i++) {
      await waitForMemory(timings[f]?.mb ?? 0);
      r = await runOnce(f, envOf(f));
      r.tries = i + 1;
      if (!r.killed && !r.signal) break;
      log(`  ${f} killed (${r.signal ?? 'SIGKILL'})${i + 1 < tries ? ', run again alone' : ''}`);
      if (i + 1 < tries) await sleep(pause);
    }
    r.why = verdict(r);
    results.push(r);
    if (keep && !r.killed && !r.signal && !Object.keys(envOf(f)).length) timings[f] = { seconds: r.seconds, mb: r.mb, tests: r.tests, at: new Date().toISOString() };
    if (keep) writeFileSync(TIMINGS, `${JSON.stringify(timings, null, 1)}\n`);
    log(`${r.why ? 'FAIL' : 'ok  '} ${r.seconds.toFixed(1).padStart(6)} s ${String(r.mb).padStart(5)} MB ${String(r.pass).padStart(4)} pass ${r.fail} fail ${r.skipped} skipped  ${f}${r.why ? `  (${r.why})` : ''}`);
    if (r.why) log(r.out.split('\n').filter((l) => /^not ok|^\s+(error|expected|actual|message):|AssertionError/.test(l)).slice(0, 30).join('\n'));
  }
  const bad = results.filter((r) => r.why);
  const notRun = bad.filter((r) => r.why.startsWith('not run'));
  const sum = (k) => results.reduce((a, r) => a + r[k], 0);
  log(`# files ${results.length}, tests ${sum('tests')}, pass ${sum('pass')}, fail ${sum('fail')}, skipped ${sum('skipped')}, ${sum('seconds').toFixed(0)} s; failing files ${bad.length}${notRun.length ? ` (not run: ${notRun.map((r) => r.file).join(', ')})` : ''}`);
  runFiles.results = results;
  return bad.length === 0;
}

export function slowest(n = 10) {
  if (!existsSync(TIMINGS)) return [];
  const t = JSON.parse(readFileSync(TIMINGS, 'utf8'));
  return Object.entries(t).filter(([f]) => existsSync(join(REPO, f))).sort((a, b) => b[1].seconds - a[1].seconds).slice(0, n);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--slow') {
    const rows = slowest(Number(args[1] ?? 10));
    if (!rows.length) { console.log('no timings yet: run `npm run test:all` (or any test:* script) first'); return; }
    for (const [f, t] of rows) console.log(`${t.seconds.toFixed(1).padStart(6)} s ${String(t.mb ?? '?').padStart(5)} MB ${String(t.tests).padStart(4)} tests  ${f}  (${t.at.slice(0, 16)})`);
    const all = Object.values(JSON.parse(readFileSync(TIMINGS, 'utf8')));
    console.log(`# ${all.length} files timed, ${all.reduce((a, t) => a + t.seconds, 0).toFixed(0)} s in all`);
    return;
  }
  if (args[0] === '--changed' || args[0] === '--plan') {
    // the build first: it rewrites the generated shards (derived, joins, kinds) a change of facts moves, and those
    // paths then count as changed too
    if (args[0] === '--changed') {
      const t0 = Date.now();
      await waitForMemory(2500);
      execFileSync('npm', ['run', '--silent', 'build'], { cwd: REPO, stdio: ['ignore', 'ignore', 'inherit'] });
      console.log(`# npm run build: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    const paths = changedPaths(args[1] ?? 'origin/main');
    const why = plan(paths);
    console.log(`# ${paths.length} changed paths vs ${args[1] ?? 'origin/main'}; ${why.size} test files`);
    const envOf = (t) => (why.scope.get(t) ? { SKW_WORLDS: [...why.scope.get(t)].join(',') } : {});
    for (const [t, r] of why) console.log(`  ${t}${envOf(t).SKW_WORLDS ? ` (worlds ${envOf(t).SKW_WORLDS})` : ''}  <- ${r.slice(0, 3).join(', ')}${r.length > 3 ? ` (+${r.length - 3})` : ''}`);
    if (args[0] === '--plan') return;
    process.exitCode = (await runFiles([...why.keys()], { envOf })) ? 0 : 1;
    return;
  }
  const files = args.length ? args : allTests();
  process.exitCode = (await runFiles(files)) ? 0 : 1;
  if (!args.length) { console.log('# slowest'); for (const [f, t] of slowest(10)) console.log(`${t.seconds.toFixed(1).padStart(6)} s  ${f}`); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
