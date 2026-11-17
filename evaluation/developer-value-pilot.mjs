#!/usr/bin/env node
// A/B developer workflow pilot against an independently maintained GAD instance.
// The benchmark site, its data and its built-in APIs are NOT authored here.
// Do not publish trial workspaces: they can contain raw agent traces and code.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, createWriteStream, symlinkSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { finished } from 'node:stream/promises';

const evalDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(evalDir, '../skills/web-automation-development');
const source = 'https://github.com/jaktestowac/gad-gui-api-demo';
const sourceTests = [
  `${source}/blob/main/tests/test/articles.spec.js`,
  `${source}/blob/main/tests/test/comments.spec.js`,
];

function optionsFromArgs(args) {
  const o = { dryRun: false, model: '', effort: 'low', baseUrl: 'http://127.0.0.1:3000',
    outputRoot: join(tmpdir(), 'wad-developer-value'), timeoutMs: 600000 };
  const fields = { '--model': 'model', '--effort': 'effort', '--base-url': 'baseUrl',
    '--output-root': 'outputRoot', '--timeout-ms': 'timeoutMs' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') { o.dryRun = true; continue; }
    if (!fields[args[i]] || !args[i + 1]) throw new Error(`Unknown or incomplete argument: ${args[i]}`);
    const key = fields[args[i]];
    o[key] = args[++i];
  }
  o.timeoutMs = Number(o.timeoutMs);
  if (!Number.isInteger(o.timeoutMs) || o.timeoutMs < 60000 || o.timeoutMs > 3600000) {
    throw new Error('--timeout-ms must be between 60000 and 3600000');
  }
  if (!['low', 'medium', 'high', 'xhigh'].includes(o.effort)) throw new Error('Unsupported reasoning effort');
  const parsedUrl = new URL(o.baseUrl);
  if (parsedUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsedUrl.hostname)) {
    throw new Error('For safety, the pilot only targets a locally hosted HTTP instance');
  }
  o.baseUrl = parsedUrl.origin;
  if (!o.dryRun && !o.model) throw new Error('Specify --model to pin both experiment arms');
  return o;
}

function taskText(baseUrl) {
  return `# Web automation development task (same for both arms)\n\n` +
    `Application: locally running GAD GUI/API Demo, ${baseUrl}.\n` +
    `Source: ${source}. The application is already running; do not modify its server or source.\n\n` +
    `Develop an independently runnable data collection tool for this application. ` +
    `Collect the 20 most recent articles (date descending) and their detail data, ` +
    `and compute the number of comments associated with each article. ` +
    `Implement the entry point as collector.mjs, run it with Node.js, and ` +
    `write output/articles.jsonl with one JSON object per article in descending date order: ` +
    `id, title, user_id, date, body, comment_count. ` +
    `Write output/summary.json containing complete (boolean), saved (number), and errors (array).\n\n` +
    `The tool must be rerunnable: running it again should not introduce duplicates or change ` +
    `the intended 20-record result. Develop the script, actually run it, debug any failures, ` +
    `and verify that its real outputs meet the business requirements. ` +
    `Document the run command in RUN.md. Choose the development and implementation route yourself.\n\n` +
    `Allowed: read-only interactions with this local demonstration application through its UI or authorized public API. ` +
    `Forbidden: changes to application data, reading the application's database/source/test fixtures, ` +
    `using fabricated records as output, or accessing unrelated sites/accounts. ` +
    `Do not replace verification with a success toast or merely executable code.\n`;
}

function sha(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

function parseTrace(path, skillText = null) {
  const stats = { toolCalls: 0, failedCommands: 0, fileChanges: 0,
    inputTokens: null, outputTokens: null, skillReadEvent: null };
  const paragraph = skillText?.split(/\r?\n/).find(x => x.startsWith('description:'));
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    let event;
    try { event = JSON.parse(lines[i]); } catch { continue; }
    const item = event.item ?? {};
    if (event.type === 'item.started' && ['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(item.type)) {
      stats.toolCalls++;
    }
    if (event.type === 'item.started' && item.type === 'file_change') stats.fileChanges++;
    if (event.type === 'item.completed' && item.type === 'command_execution' &&
        Number.isInteger(item.exit_code) && item.exit_code !== 0) stats.failedCommands++;
    if (paragraph && event.type === 'item.completed' && item.type === 'command_execution' &&
        item.exit_code === 0 && /\b(?:Get-Content|cat|type|head|sed)\b/i.test(item.command ?? '') &&
        /web-automation-development[/\\]SKILL\.md/i.test(item.command ?? '') &&
        (item.aggregated_output ?? '').includes(paragraph)) {
      stats.skillReadEvent ??= item.id ?? i;
    }
    const usage = event.usage ?? event.turn?.usage;
    if (Number.isFinite(usage?.input_tokens)) stats.inputTokens = usage.input_tokens;
    if (Number.isFinite(usage?.output_tokens)) stats.outputTokens = usage.output_tokens;
  }
  return stats;
}

function compare(trials) {
  const a = trials.find(x => x.arm === 'A');
  const b = trials.find(x => x.arm === 'B');
  if (!a || !b) return null;
  const totalTokens = trial => Number.isFinite(trial.tokens?.input) && Number.isFinite(trial.tokens?.output)
    ? trial.tokens.input + trial.tokens.output : null;
  const delta = (vA, vB) => Number.isFinite(vA) && Number.isFinite(vB) ? vB - vA : null;
  return {
    interpretation: a.outcome === 'OUTPUT_PASS' && b.outcome === 'OUTPUT_PASS'
      ? 'SAME_VERIFIED_OUTPUT_OUTCOME; review costs and process evidence'
      : a.outcome !== 'OUTPUT_PASS' && b.outcome === 'OUTPUT_PASS'
        ? 'B_ONLY_OUTPUT_PASS; inspect whether failure is attributable to the Skill'
        : a.outcome === 'OUTPUT_PASS' && b.outcome !== 'OUTPUT_PASS'
          ? 'A_ONLY_OUTPUT_PASS; investigate possible Skill regression'
          : 'NO_VERIFIED_OUTPUT_WINNER',
    outcome: { A: a.outcome, B: b.outcome },
    deltaBMinusA: {
      totalTokens: delta(totalTokens(a), totalTokens(b)),
      toolCalls: delta(a.toolCalls, b.toolCalls),
      failedCommands: delta(a.failedCommands, b.failedCommands),
      wallTimeMs: delta(a.wallTimeMs, b.wallTimeMs),
    },
    noCausalOrGeneralBenefitClaim: true,
    routeAndReworkReview: 'PENDING_MANUAL_TRACE_REVIEW',
  };
}

async function jsonGet(url) {
  let response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(15000) }); }
  catch (error) { throw new Error(`Cannot reach local GAD at ${new URL(url).origin}; start the upstream app first (${String(error)})`); }
  if (!response.ok) throw new Error(`Preflight HTTP ${response.status}: ${url}`);
  return response.json();
}

async function oracle(baseUrl) {
  const [articles, comments, top] = await Promise.all([
    jsonGet(`${baseUrl}/api/articles`),
    jsonGet(`${baseUrl}/api/comments`),
    jsonGet(`${baseUrl}/api/articles?_limit=20&_page=1&_sort=date&_order=DESC`),
  ]);
  if (![articles, comments, top].every(Array.isArray) || top.length !== 20 ||
      articles.some(x => x.id === undefined || x.title === undefined || x.date === undefined) ||
      comments.some(x => x.id === undefined || x.article_id === undefined)) {
    throw new Error('GAD API data is not ready: expected article/comment arrays and 20 top articles');
  }
  const topDetails = await Promise.all(top.map(a => jsonGet(`${baseUrl}/api/articles/${a.id}`)));
  const counts = new Map();
  for (const c of comments) counts.set(String(c.article_id), (counts.get(String(c.article_id)) ?? 0) + 1);
  const expected = topDetails.map(a => ({
    id: a.id, title: a.title, user_id: a.user_id, date: a.date,
    body: a.body, comment_count: counts.get(String(a.id)) ?? 0,
  }));
  const fingerprint = sha({ articles, comments });
  return { expected, fingerprint, articleCount: articles.length, commentCount: comments.length };
}

function gradeFiles(dir, expected) {
  const dataPath = join(dir, 'output/articles.jsonl');
  const summaryPath = join(dir, 'output/summary.json');
  const checks = { runnableCode: existsSync(join(dir, 'collector.mjs')) && existsSync(join(dir, 'RUN.md')),
    dataFile: existsSync(dataPath), summaryFile: existsSync(summaryPath),
    recordCount: false, idsUnique: false, orderedIds: false,
    fieldsAndComments: false, declaredComplete: false };
  let detail = null;
  try {
    if (!checks.dataFile || !checks.summaryFile) throw new Error('Missing output artifacts');
    const rows = readFileSync(dataPath, 'utf8').trim().split(/\r?\n/).map(x => JSON.parse(x));
    const report = JSON.parse(readFileSync(summaryPath, 'utf8'));
    checks.recordCount = rows.length === 20;
    checks.idsUnique = new Set(rows.map(x => String(x.id))).size === rows.length;
    checks.orderedIds = rows.map(x => String(x.id)).join(',') === expected.map(x => String(x.id)).join(',');
    checks.fieldsAndComments = rows.length === expected.length && rows.every((x, i) =>
      ['id', 'title', 'user_id', 'date', 'body', 'comment_count'].every(k =>
        JSON.stringify(x[k]) === JSON.stringify(expected[i][k])));
    checks.declaredComplete = report.complete === true && report.saved === 20 &&
      Array.isArray(report.errors) && report.errors.length === 0;
    detail = { saved: rows.length, declaredSaved: report.saved };
  } catch (error) { detail = { error: String(error) }; }
  return { outcome: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL', checks, detail };
}

function linkDeps(target) {
  const sourceDir = join(evalDir, 'node_modules');
  if (!existsSync(join(sourceDir, 'playwright'))) {
    throw new Error('Install evaluation dependencies first: npm install --prefix evaluation');
  }
  try { symlinkSync(sourceDir, join(target, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    cpSync(sourceDir, join(target, 'node_modules'), { recursive: true });
  }
}

function checkSkillIsolation() {
  const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
  const candidates = [join(homedir(), '.agents/skills/web-automation-development/SKILL.md'),
    join(codexHome, 'skills/web-automation-development/SKILL.md')];
  const collisions = candidates.filter(existsSync);
  const remote = join(codexHome, 'skills/remote-skills');
  if (existsSync(remote)) {
    for (const entry of readdirSync(remote, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('skill-')) continue;
      const skillFile = join(remote, entry.name, 'SKILL.md');
      if (existsSync(skillFile) && /^name:\s*web-automation-development\s*$/m.test(readFileSync(skillFile, 'utf8').slice(0, 1000))) {
        collisions.push(skillFile);
      }
    }
  }
  if (collisions.length) throw new Error('User-level target Skill may contaminate baseline A. ' +
    'Use a clean Codex environment for the experiment; no files were modified.');
}

async function runCodex(cwd, prompt, opt) {
  const args = ['exec', '--json', '--ephemeral', '--ignore-user-config', '--skip-git-repo-check',
    '-C', cwd, '--sandbox', 'workspace-write', '-m', opt.model,
    '-c', `model_reasoning_effort=${opt.effort}`,
    '-c', 'sandbox_workspace_write.network_access=true', '-c', 'approval_policy="never"', prompt];
  const stdoutFile = createWriteStream(join(cwd, 'codex.jsonl'), { flags: 'wx' });
  const stderrFile = createWriteStream(join(cwd, 'codex.stderr.txt'), { flags: 'wx' });
  const started = Date.now();
  const result = await new Promise(resolveRun => {
    const child = spawn('codex', args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(stdoutFile);
    child.stderr.pipe(stderrFile);
    let timedOut = false;
    let spawnError = null;
    const timeout = setTimeout(() => { timedOut = true; child.kill(); }, opt.timeoutMs);
    child.on('error', error => { spawnError = error.message; });
    child.on('close', async code => {
      clearTimeout(timeout);
      await Promise.all([finished(stdoutFile), finished(stderrFile)]);
      resolveRun({ exitCode: code, timedOut, spawnError, wallTimeMs: Date.now() - started });
    });
  });
  return result;
}

async function main() {
  const opt = optionsFromArgs(process.argv.slice(2));
  if (opt.dryRun) {
    process.stdout.write(JSON.stringify({ experiment: 'GAD article/comment developer A/B',
      arms: ['A (no target Skill)', 'B (native target Skill)'], model: opt.model || 'MUST SPECIFY',
      baseUrl: opt.baseUrl, sourceTests, task: taskText(opt.baseUrl),
      verdict: 'NOT_RUN' }, null, 2) + '\n');
    return;
  }
  const cli = spawnSync('codex', ['--version'], { encoding: 'utf8' });
  if (cli.status !== 0) throw new Error('Codex CLI unavailable');
  if (!existsSync(join(skillDir, 'SKILL.md'))) throw new Error('Target Skill missing');
  checkSkillIsolation();
  const first = await oracle(opt.baseUrl);
  mkdirSync(opt.outputRoot, { recursive: true });
  const batch = mkdtempSync(join(opt.outputRoot, 'gad-pilot-'));
  const record = { experiment: 'GAD article/comment developer A/B', status: 'STARTED',
    startedAt: new Date().toISOString(), model: opt.model, effort: opt.effort, baseUrl: opt.baseUrl,
    upstream: sourceTests, codexVersion: cli.stdout.trim(), skillSha256: createHash('sha256').update(readFileSync(join(skillDir, 'SKILL.md'))).digest('hex'),
    sourceDatasetFingerprint: first.fingerprint, sourceCounts: { articles: first.articleCount, comments: first.commentCount }, trials: [] };
  writeFileSync(join(batch, 'plan.json'), JSON.stringify(record, null, 2));

  for (const arm of ['A', 'B']) {
    const current = await oracle(opt.baseUrl);
    if (current.fingerprint !== first.fingerprint) throw new Error('GAD dataset drifted before arm ' + arm);
    const dir = join(batch, `arm-${arm}`);
    mkdirSync(dir, { recursive: true });
    linkDeps(dir);
    writeFileSync(join(dir, 'TASK.md'), taskText(opt.baseUrl));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'wad-gad-developer-pilot', private: true, type: 'module' }, null, 2));
    if (arm === 'B') cpSync(skillDir, join(dir, '.agents/skills/web-automation-development'), { recursive: true });
    const prompt = arm === 'B'
      ? 'Use $web-automation-development to independently complete TASK.md. Implement, execute, debug and verify. Do not stop at a proposal.'
      : 'Independently complete TASK.md. Implement, execute, debug and verify. Do not stop at a proposal.';
    const execution = await runCodex(dir, prompt, opt);
    const readback = await oracle(opt.baseUrl);
    const unchanged = readback.fingerprint === first.fingerprint;
    const grade = gradeFiles(dir, first.expected);
    const telemetry = parseTrace(join(dir, 'codex.jsonl'), arm === 'B' ? readFileSync(join(skillDir, 'SKILL.md'), 'utf8') : null);
    const trial = { arm, ...execution,
      outcome: execution.exitCode === 0 && unchanged ? (grade.outcome === 'PASS' ? 'OUTPUT_PASS' : 'OUTPUT_FAIL') : 'BLOCKED',
      grade, sourceUnchanged: unchanged, nativeSkillLoaded: arm === 'A' ? 'NOT_AVAILABLE' :
        telemetry.skillReadEvent ? 'OBSERVED' : 'INCONCLUSIVE',
      toolCalls: telemetry.toolCalls, failedCommands: telemetry.failedCommands,
      observedFileChanges: telemetry.fileChanges,
      tokens: { input: telemetry.inputTokens, output: telemetry.outputTokens },
      idempotenceIndependentlyVerified: false,
      developmentDecisionReview: 'REQUIRES_MANUAL_TRACE_REVIEW',
      rawArtifactsDir: basename(dir) };
    record.trials.push(trial);
    writeFileSync(join(dir, 'trial-result.json'), JSON.stringify(trial, null, 2));
    writeFileSync(join(batch, 'summary.json'), JSON.stringify(record, null, 2));
    process.stdout.write(`Arm ${arm}: ${trial.outcome}; skill=${trial.nativeSkillLoaded}; ` +
      `calls=${trial.toolCalls}; tokens=${JSON.stringify(trial.tokens)}; time=${trial.wallTimeMs}ms\n`);
    if (!unchanged) throw new Error('Application changed during trial; cannot proceed with a comparable experiment');
  }
  record.status = 'COMPLETE';
  record.endedAt = new Date().toISOString();
  record.comparison = compare(record.trials);
  record.interpretation = 'One paired real-development observation, NOT a general Skill benefit claim. OUTPUT_PASS verifies the final output only, not the idempotence or the quality of all decisions. Review raw traces for route decisions, rework and manual intervention.';
  writeFileSync(join(batch, 'summary.json'), JSON.stringify(record, null, 2));
  process.stdout.write(`Observed A/B differences (B minus A): ${JSON.stringify(record.comparison)}\n`);
  process.stdout.write(`Experiment record (private, do not commit): ${batch}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`Pilot stopped: ${String(error)}\n`); process.exitCode = 1; });
}
