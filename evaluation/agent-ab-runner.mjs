#!/usr/bin/env node
// Controlled, local Codex A/B pilot. Does not create a test website.
// Raw traces and generated automation stay outside the Git repository.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync, cpSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const evaluationDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(evaluationDir);
const skillDir = join(repoRoot, 'skills', 'web-automation-development');
const defaultRunRoot = join(tmpdir(), 'web-automation-development-ab');

// User tasks are adapted from the existing Playwright TodoMVC and The Internet examples.
// They are identical in both arms. The artifact contract makes an independent browser
// execution possible; the agent never receives the grader implementation.
const cases = {
  'PW-01': {
    source: 'https://github.com/microsoft/playwright/blob/main/examples/todomvc/specs/basic-operations.plan.md',
    prompt: '在 https://demo.playwright.dev/todomvc/ 新增一条 Buy groceries，确认页面显示成功。',
  },
  'PW-03': {
    source: 'https://github.com/microsoft/playwright/blob/main/examples/todomvc/specs/basic-operations.plan.md',
    prompt: '在 https://demo.playwright.dev/todomvc/ 新增 Buy groceries，编辑时输入 Wrong uncommitted edit，用 Escape 取消。',
  },
  'TI-01': {
    source: 'https://github.com/saucelabs/the-internet',
    prompt: '在 https://the-internet.herokuapp.com/ 的 Dynamic Loading Example 2 中触发加载，确认真正加载出的内容。',
  },
  'TI-03': {
    source: 'https://github.com/saucelabs/the-internet',
    prompt: '在 https://the-internet.herokuapp.com/ 的 Nested Frames 示例中，读取上排中间和下排框架的文字，分别报告来源。',
  },
};

function parseArgs(argv) {
  const options = { caseIds: Object.keys(cases), repeats: 2, arms: ['A', 'B'], dryRun: false, grade: false, timeoutMs: 180000, model: null, effort: 'low', outputRoot: defaultRunRoot };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [flag, inline] = arg.split('=', 2);
    const value = inline ?? argv[index + 1];
    if (flag === '--dry-run') { options.dryRun = true; continue; }
    if (flag === '--grade') { options.grade = true; continue; }
    if (!['--cases', '--repeats', '--arm', '--timeout-ms', '--model', '--effort', '--output-root'].includes(flag)) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    if (inline === undefined) index += 1;
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--cases') options.caseIds = value.split(',');
    if (flag === '--repeats') options.repeats = Number(value);
    if (flag === '--timeout-ms') options.timeoutMs = Number(value);
    if (flag === '--model') options.model = value;
    if (flag === '--effort') options.effort = value;
    if (flag === '--output-root') options.outputRoot = value;
    if (flag === '--arm') options.arms = value === 'both' ? ['A', 'B'] : [value];
  }
  if (!options.caseIds.every(id => Object.hasOwn(cases, id))) throw new Error('Unsupported case ID');
  if (!options.arms.every(arm => ['A', 'B'].includes(arm))) throw new Error('Use --arm A, B, or both');
  if (!Number.isInteger(options.repeats) || options.repeats < 1 || options.repeats > 10) throw new Error('Repeats must be 1..10');
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 10000) throw new Error('Invalid timeout');
  if (!['low', 'medium', 'high', 'xhigh'].includes(options.effort)) throw new Error('Invalid effort');
  return options;
}

function buildPrompt(caseId) {
  const format = caseId === 'TI-03'
    ? '完成后返回 { middle: 字符串, bottom: 字符串 }，值必须来自实际访问的两个不同 frame。'
    : '完成后可返回简短的观察结果。';
  return `${cases[caseId].prompt}\n\n请为上述任务开发一个可重复执行的 Playwright Node.js 脚本，写在当前目录 automation.cjs。` +
    `脚本必须使用 module.exports = async function ({ page }) { ... } 形式；外部会提供全新的 Playwright page 实例并独立执行验证。` +
    `脚本应自行导航到目标公开演示网站，只操作该公开演示，不能创建测试网站或使用假数据替代网页。${format}`;
}

function detectGlobalSkillCollision() {
  const paths = [
    join(homedir(), '.agents', 'skills', 'web-automation-development', 'SKILL.md'),
    join(homedir(), '.codex', 'skills', 'web-automation-development', 'SKILL.md'),
  ];
  const matches = paths.filter(existsSync);
  const remoteSkills = join(homedir(), '.codex', 'skills', 'remote-skills');
  if (existsSync(remoteSkills)) {
    for (const entry of readdirSync(remoteSkills, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('skill-')) continue;
      const file = join(remoteSkills, entry.name, 'SKILL.md');
      if (existsSync(file) && /^name:\s*web-automation-development\s*$/m.test(readFileSync(file, 'utf8').slice(0, 1000))) matches.push(file);
    }
  }
  for (const file of [join(repoRoot, 'AGENTS.md'), join(evaluationDir, 'AGENTS.md')]) {
    if (existsSync(file)) matches.push(`${file} (parent instructions require manual equivalence check)`);
  }
  return matches;
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function preflightBrowser() {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { throw new Error('Install evaluator dependencies first: npm install --prefix evaluation'); }
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.WAD_BROWSER_EXECUTABLE ? { executablePath: process.env.WAD_BROWSER_EXECUTABLE } : {}),
    });
  } catch (error) {
    throw new Error(`Chromium unavailable: ${String(error).slice(0, 350)}. Run npx playwright install chromium inside evaluation/ or select a permitted local browser.`);
  } finally { await browser?.close().catch(() => {}); }
}

function runCodex(cwd, prompt, options, tracePath, stderrPath) {
  return new Promise(resolveRun => {
    const args = [
      'exec', '--json', '--ephemeral', '--ignore-user-config', '--skip-git-repo-check',
      '-C', cwd, '--full-auto', '-c', `model_reasoning_effort=${options.effort}`,
    ];
    if (options.model) args.push('-m', options.model);
    args.push(prompt);
    const started = Date.now();
    const out = createWriteStream(tracePath, { flags: 'wx' });
    const err = createWriteStream(stderrPath, { flags: 'wx' });
    const child = spawn('codex', args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(out);
    child.stderr.pipe(err);
    let timedOut = false;
    let errorMessage = null;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, options.timeoutMs);
    child.on('error', error => { errorMessage = error.message; });
    child.on('close', async code => {
      clearTimeout(timer);
      out.end(); err.end();
      await Promise.all([
        new Promise(done => out.on('finish', done)),
        new Promise(done => err.on('finish', done)),
      ]);
      resolveRun({ exitCode: code, timedOut, errorMessage, wallTimeMs: Date.now() - started });
    });
  });
}

async function parseTrace(path) {
  const report = { toolCalls: 0, inputTokens: null, outputTokens: null, observedSkillRead: false, events: 0 };
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of lines) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    report.events += 1;
    const item = event.item ?? {};
    if (event.type === 'item.started' && ['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(item.type)) {
      report.toolCalls += 1;
    }
    const readSignal = `${item.command ?? ''} ${item.path ?? ''} ${item.text ?? ''}`;
    if (/web-automation-development[/\\]SKILL\.md/.test(readSignal)) report.observedSkillRead = true;
    const usage = event.usage ?? event.turn?.usage ?? null;
    if (usage && Number.isFinite(usage.input_tokens)) report.inputTokens = usage.input_tokens;
    if (usage && Number.isFinite(usage.output_tokens)) report.outputTokens = usage.output_tokens;
  }
  return report;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const trialPlan = [];
  for (const caseId of options.caseIds) {
    for (let repeat = 1; repeat <= options.repeats; repeat += 1) {
      for (const arm of options.arms) trialPlan.push({ caseId, arm, repeat });
    }
  }
  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify({ total: trialPlan.length, trials: trialPlan, browser: process.env.WAD_BROWSER_EXECUTABLE || 'Playwright managed Chromium' }, null, 2)}\n`);
    return;
  }

  if (!existsSync(join(skillDir, 'SKILL.md'))) throw new Error('Local Skill snapshot missing');
  const collisions = detectGlobalSkillCollision();
  if (collisions.length > 0) throw new Error(`A/B isolation cannot be guaranteed because of user-scope Skills or parent instructions: ${collisions.map(path => basename(path)).join(', ')}. Review isolation before the pilot.`);
  const installed = spawnSync('codex', ['--version'], { encoding: 'utf8' });
  if (installed.status !== 0) throw new Error('Codex CLI unavailable; install and sign in locally before the pilot');
  if (options.grade) await preflightBrowser();

  if (!existsSync(join(evaluationDir, 'node_modules', 'playwright'))) {
    throw new Error('Playwright Node dependency missing: run npm install --prefix evaluation');
  }
  mkdirSync(options.outputRoot, { recursive: true });
  const batchDir = mkdtempSync(join(options.outputRoot, 'pilot-'));
  // Trial code resolves the same dependencies without seeing the evaluation rubric.
  const dependencySource = join(evaluationDir, 'node_modules');
  const dependencyTarget = join(batchDir, 'node_modules');
  try {
    symlinkSync(dependencySource, dependencyTarget, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    cpSync(dependencySource, dependencyTarget, { recursive: true });
  }
  const batch = { date: new Date().toISOString(), codexVersion: installed.stdout.trim(), skillSha256: hashFile(join(skillDir, 'SKILL.md')), model: options.model ?? 'CLI default (not pinned)', effort: options.effort, trials: [] };
  writeFileSync(join(batchDir, 'plan.json'), JSON.stringify({ ...batch, trialPlan, source: cases }, null, 2));

  for (const trial of trialPlan) {
    const trialDir = join(batchDir, `${trial.caseId}-${trial.arm}-${trial.repeat}`);
    mkdirSync(trialDir, { recursive: true });
    if (trial.arm === 'B') {
      cpSync(skillDir, join(trialDir, '.agents', 'skills', 'web-automation-development'), { recursive: true });
    }
    const tracePath = join(trialDir, 'codex.jsonl');
    const stderrPath = join(trialDir, 'codex.stderr.txt');
    const execution = await runCodex(trialDir, buildPrompt(trial.caseId), options, tracePath, stderrPath);
    const telemetry = await parseTrace(tracePath);
    let grade = { outcome: 'BLOCKED', reason: execution.timedOut ? 'Codex timed out' : `Codex failed (exit ${execution.exitCode})` };
    if (execution.exitCode === 0) {
      grade = { outcome: 'INCONCLUSIVE', reason: 'Generated code not executed; pass --grade only in a disposable isolated environment' };
      if (options.grade) {
        const { gradeAgentOutput } = await import('./agent-ab-grader.mjs');
        grade = await gradeAgentOutput(trial.caseId, trialDir, { browserExecutable: process.env.WAD_BROWSER_EXECUTABLE });
      }
    }
    const result = {
      ...trial, source: cases[trial.caseId].source, outcome: grade.outcome, reason: grade.reason,
      observed: grade.observed ?? null, skillAvailable: trial.arm === 'B',
      actualSkillLoaded: telemetry.observedSkillRead ? 'YES (trace read)' : 'INCONCLUSIVE',
      codexExitCode: execution.exitCode, timedOut: execution.timedOut, errorMessage: execution.errorMessage,
      toolCalls: telemetry.toolCalls, tokens: telemetry.inputTokens === null ? null : {
        input: telemetry.inputTokens, output: telemetry.outputTokens,
      },
      wallTimeMs: execution.wallTimeMs, relativeEvidenceDir: basename(trialDir),
    };
    writeFileSync(join(trialDir, 'result.json'), JSON.stringify(result, null, 2));
    batch.trials.push(result);
    writeFileSync(join(batchDir, 'summary.json'), JSON.stringify(batch, null, 2));
    process.stdout.write(`${trial.caseId} ${trial.arm} #${trial.repeat}: ${result.outcome} (${result.wallTimeMs}ms; skill read ${result.actualSkillLoaded})\n`);
  }
  process.stdout.write(`Private evidence saved under ${batchDir}\n`);
}

main().catch(error => {
  process.stderr.write(`A/B pilot not started/completed: ${String(error)}\n`);
  process.exitCode = 1;
});
