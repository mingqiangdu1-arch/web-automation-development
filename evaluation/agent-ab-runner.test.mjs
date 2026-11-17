import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseTrace } from './agent-ab-runner.mjs';

test('only a successful read returning the staged Skill content supplies read evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wad-trace-test-'));
  try {
    const trace = join(directory, 'trace.jsonl');
    const command = 'Get-Content .agents/skills/web-automation-development/SKILL.md';
    const description = 'description: staged benchmark Skill';
    const completion = item => ({ type: 'item.completed', item });
    const read = { id: 'read-4', type: 'command_execution', command, exit_code: 0, aggregated_output: description };
    const writeTrace = events => writeFile(trace, events.map(event => JSON.stringify(event)).join('\n'));
    const misleading = [
      completion({ type: 'agent_message', text: 'I loaded web-automation-development/SKILL.md' }),
      completion({ ...read, exit_code: 1 }),
      completion({ ...read, aggregated_output: 'permission denied' }),
    ];
    await writeTrace(misleading);
    assert.equal((await parseTrace(trace, description)).skillReadEvent, null);
    await writeTrace([...misleading, completion(read)]);
    assert.equal((await parseTrace(trace, description)).skillReadEvent, 'read-4');
    assert.equal((await parseTrace(trace)).skillReadEvent, null);
  } finally {
    await rm(directory, { recursive: true });
  }
});
