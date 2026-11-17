import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

export async function gradeAgentOutput(caseId, trialDir, options = {}) {
  const source = join(trialDir, 'automation.cjs');
  if (!existsSync(source)) {
    return { outcome: 'FAIL', reason: 'automation.cjs missing' };
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return { outcome: 'BLOCKED', reason: 'Playwright dependency not installed in evaluation/' };
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(options.browserExecutable ? { executablePath: options.browserExecutable } : {}),
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    if (caseId === 'PW-03') {
      await page.addInitScript(() => {
        window.__wadObservedEvents = [];
        document.addEventListener('keydown', event => {
          if (event.key === 'Escape') window.__wadObservedEvents.push('ESCAPE');
        }, true);
        document.addEventListener('input', event => {
          if (event.target?.value === 'Wrong uncommitted edit') window.__wadObservedEvents.push('WRONG_EDIT_TYPED');
        }, true);
      });
    }

    // This verifier owns the browser and context. Every trial has fresh storage.
    delete require.cache[require.resolve(source)];
    const automation = require(source);
    if (typeof automation !== 'function') {
      return { outcome: 'FAIL', reason: 'automation.cjs must export an async function' };
    }

    let timeout;
    let result;
    try {
      result = await Promise.race([
        Promise.resolve().then(() => automation({ page })),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('automation timeout')), 45000);
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }

    if (caseId === 'PW-01' || caseId === 'PW-03') {
      const text = await page.locator('.todo-list li').allTextContents();
      const active = await page.locator('.todo-count').innerText();
      const okay = text.length === 1 && text[0].trim() === 'Buy groceries' &&
        /1\s+item\s+left/i.test(active);
      const noWrong = !text.some(value => value.includes('Wrong uncommitted edit'));
      const events = caseId === 'PW-03'
        ? await page.evaluate(() => window.__wadObservedEvents ?? []) : [];
      const cancelObserved = caseId !== 'PW-03' || (events.includes('ESCAPE') && events.includes('WRONG_EDIT_TYPED'));
      return {
        outcome: okay && noWrong && cancelObserved ? 'PASS' : 'FAIL',
        reason: okay && noWrong && cancelObserved
          ? (caseId === 'PW-03' ? 'DOM, active counter, and edit cancellation verified' : 'Todo and active counter verified')
          : (caseId === 'PW-03' ? 'Todo content/counter or cancellation evidence mismatch' : 'Todo content or active counter mismatch'),
        observed: { itemCount: text.length, itemTexts: text.slice(0, 5), activeCounter: active, cancelEvents: events },
      };
    }

    if (caseId === 'TI-01') {
      const heading = await page.locator('#finish h4').textContent().catch(() => null);
      return {
        outcome: heading?.trim() === 'Hello World!' ? 'PASS' : 'FAIL',
        reason: heading?.trim() === 'Hello World!' ? 'Dynamic content appeared' : 'Dynamic content missing',
        observed: { heading: heading?.trim() ?? null },
      };
    }

    if (caseId === 'TI-03') {
      const reported = result && typeof result === 'object' ? result : {};
      const siteVisited = new URL(page.url()).hostname === 'the-internet.herokuapp.com';
      const actualMiddle = siteVisited ? await page.frameLocator('frame[name="frame-top"]').frameLocator('frame[name="frame-middle"]').locator('body').innerText().catch(() => null) : null;
      const actualBottom = siteVisited ? await page.frameLocator('frame[name="frame-bottom"]').locator('body').innerText().catch(() => null) : null;
      const okay = reported.middle === actualMiddle?.trim() && reported.bottom === actualBottom?.trim() && reported.middle === 'MIDDLE' && reported.bottom === 'BOTTOM';
      return {
        outcome: okay ? 'PASS' : 'FAIL',
        reason: okay ? 'Returned values match independent frame reads' : 'Incorrect/missing frame results',
        observed: { middle: reported.middle ?? null, bottom: reported.bottom ?? null, browserMiddle: actualMiddle?.trim() ?? null, browserBottom: actualBottom?.trim() ?? null },
      };
    }

    return { outcome: 'INCONCLUSIVE', reason: `No independent grader for ${caseId}` };
  } catch (error) {
    return { outcome: 'FAIL', reason: String(error).slice(0, 500) };
  } finally {
    await browser?.close().catch(() => {});
  }
}

if (process.argv[1]?.endsWith('agent-ab-grader.mjs') && process.argv.length > 3) {
  const result = await gradeAgentOutput(process.argv[2], process.argv[3], {
    browserExecutable: process.env.WAD_BROWSER_EXECUTABLE || undefined,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.outcome === 'PASS' ? 0 : 1;
}

