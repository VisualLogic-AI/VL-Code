/**
 * VL Component Test Tool — Playwright-powered testing of compiled VL apps
 *
 * Targets VL components using their `instance-id` attributes from VL source code.
 * Ported from vl-autotest v2.6 test-runner with all VL SPA adaptations:
 *   - instance-id → data-compid → data-key multi-fallback selector resolution
 *   - VL wrapper div penetration for fill (input inside <div instance-id="...">)
 *   - SPA navigation (no URL changes, must click nav items)
 *   - Custom dropdown handling (not native <select>)
 *   - Soft-pass for elements not in play mode DOM
 *
 * Actions:
 *   open       — open a VL preview URL in the test browser
 *   click      — click a VL component by instance-id or selector
 *   fill       — fill an input (with VL wrapper penetration)
 *   select     — select from VL custom dropdown
 *   assert     — assert element visible/hidden/text
 *   snapshot   — get a compact DOM snapshot highlighting VL components
 *   screenshot — take screenshot of current state
 *   listIds    — list all instance-id elements currently in the DOM
 *   run        — run a test case (array of steps)
 *   close      — close the test browser
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';

let _browser = null;
let _page = null;

function log(tag, msg) {
  console.log(`[VLTest] [${tag}] ${msg}`);
}

async function ensureBrowser(headless = true) {
  if (_browser && _page) {
    try { await _page.evaluate(() => true); return _page; } catch {}
  }
  if (_browser) { try { await _browser.close(); } catch {} }

  _browser = await chromium.launch({ headless, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await _browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  _page = await ctx.newPage();

  // Auto-dismiss native dialogs (VL SysUI.showModal)
  _page.on('dialog', async (dialog) => {
    try {
      if (dialog.type() === 'confirm') await dialog.accept();
      else if (dialog.type() === 'prompt') await dialog.accept('');
      else await dialog.dismiss();
    } catch {}
  });

  return _page;
}

/**
 * Resolve a VL selector to a Playwright locator.
 * Strategy order (from vl-autotest v2.6):
 *   1. Playwright text=/role= prefix → pass through
 *   2. [instance-id="xxx"] → with data-key composite fallback
 *   3. CSS selector ([placeholder=], #id, .class)
 *   4. Bare string → try instance-id, then text match
 */
async function resolveSelector(page, selector) {
  if (!selector) return null;

  // Strategy 0: Playwright native prefixes
  if (selector.startsWith('text=')) return page.getByText(selector.slice(5)).first();
  if (selector.startsWith('role=')) return page.locator(selector).first();
  if (selector.startsWith('placeholder=')) return page.getByPlaceholder(selector.slice(12)).first();

  // Strategy 1: [instance-id="xxx"] with composite and fallback support
  const iidMatch = selector.match(/\[instance-id=["']?([^"'\]]+)["']?\]/);
  if (iidMatch) {
    const compId = iidMatch[1];

    // Try full composite selector first (e.g. [instance-id="x"][data-key="/y"])
    try {
      const loc = page.locator(selector).first();
      if (await loc.count() > 0) return loc;
    } catch {}

    // Try data-key alone (VL play mode may not render instance-id)
    const dkMatch = selector.match(/\[data-key=["']?([^"'\]]+)["']?\]/);
    if (dkMatch) {
      try {
        const loc = page.locator(`[data-key="${dkMatch[1]}"]`).first();
        if (await loc.count() > 0) return loc;
      } catch {}
    }

    // Try plain instance-id
    try {
      const loc = page.locator(`[instance-id="${compId}"]`).first();
      if (await loc.count() > 0) return loc;
    } catch {}

    // Try alt attributes
    try {
      const loc = page.locator(`[data-compid="${compId}"], [compid="${compId}"], [data-instance-id="${compId}"]`).first();
      if (await loc.count() > 0) return loc;
    } catch {}

    // Text fallback from camelCase compId
    const words = compId
      .replace(/([A-Z])/g, ' $1')
      .replace(/(btn|button|input|select|modal|card|container|section|panel|icon|text|label|wrap)/gi, ' ')
      .trim().split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      try {
        const loc = page.getByText(w, { exact: false });
        if (await loc.count() > 0) return loc.first();
      } catch {}
    }
  }

  // Strategy 2: CSS selector
  if (/^[#.\[]/.test(selector)) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.count() > 0) return loc;
    } catch {}

    // data-key fallback → text
    if (selector.startsWith('[data-key=')) {
      const routeKey = selector.match(/\[data-key=["']?([^"'\]]+)/)?.[1];
      if (routeKey) {
        const readable = routeKey.replace(/^\//, '')
          .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        try {
          const loc = page.getByText(readable, { exact: false });
          if (await loc.count() > 0) return loc.first();
        } catch {}
      }
    }
    return page.locator(selector).first(); // return for waitFor error
  }

  // Strategy 3: Bare string — try as instance-id, then text
  if (/^[a-zA-Z]/.test(selector) && !selector.includes(' ')) {
    try {
      const loc = page.locator(`[instance-id="${selector}"], [data-compid="${selector}"]`).first();
      if (await loc.count() > 0) return loc;
    } catch {}
  }

  // Final: text match
  return page.getByText(selector, { exact: false }).first();
}

/**
 * Fill with VL wrapper penetration (4-strategy from vl-autotest)
 */
async function vlFill(page, locator, value, timeout = 8000) {
  // Strategy 1: standard fill
  try {
    await locator.waitFor({ state: 'visible', timeout: Math.min(timeout, 6000) });
    await locator.fill(value || '');
    return 'direct fill';
  } catch (e1) {
    // Strategy 2: child input inside VL wrapper div
    if (e1.message.includes('Element is not an')) {
      try {
        const child = locator.locator('input, textarea, [contenteditable="true"]').first();
        if (await child.count() > 0) {
          await child.fill(value || '', { timeout: 5000 });
          return 'child input fill';
        }
      } catch {}
    }
    // Strategy 3: force fill
    try {
      await locator.fill(value || '', { force: true, timeout: 5000 });
      return 'force fill';
    } catch {}
    // Strategy 4: click + keyboard type
    try {
      await locator.click({ force: true, timeout: 3000 }).catch(() => {});
      await page.keyboard.type(value || '', { delay: 30 });
      return 'keyboard type';
    } catch {}
    throw e1;
  }
}

export function createVLComponentTestTool(config) {
  const ssDir = path.join(os.homedir(), '.vl-code', 'screenshots');

  const tool = {
    description: `Test VL components in compiled preview apps using Playwright.
Targets elements by their VL instance-id (from VL source code), with automatic fallback to data-key, text, and CSS selectors.
Handles VL SPA navigation, wrapper div penetration for inputs, and custom dropdowns.
Actions: open, click, fill, select, assert, snapshot, screenshot, listIds, run, close`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['open', 'click', 'fill', 'select', 'assert', 'snapshot', 'screenshot', 'listIds', 'run', 'close'],
          description: 'Test action to perform',
        },
        url: { type: 'string', description: 'Preview URL to open (for "open" action)' },
        selector: { type: 'string', description: 'VL selector: instance-id (bare or [instance-id="x"]), text=Label, [placeholder="..."], CSS selector' },
        value: { type: 'string', description: 'Value for fill/select, or expected text for assert' },
        assertType: { type: 'string', enum: ['visible', 'hidden', 'text', 'count'], description: 'Assertion type (default: visible)' },
        name: { type: 'string', description: 'Screenshot filename (without ext)' },
        steps: {
          type: 'array',
          description: 'Array of test steps for "run" action: [{action, selector, value, description}]',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              selector: { type: 'string' },
              value: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        headless: { type: 'boolean', description: 'Run browser in headless mode (default: true)' },
      },
      required: ['action'],
    },
    execute: async (input) => {
      try {
        // For close action, don't need browser
        if (input.action === 'close') {
          if (_browser) { await _browser.close().catch(() => {}); _browser = null; _page = null; }
          return { closed: true };
        }

        const page = await ensureBrowser(input.headless !== false);

        switch (input.action) {
          case 'open': {
            if (!input.url) return { error: 'url required' };
            await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            // Wait for VL SPA to render
            try {
              await page.waitForLoadState('networkidle', { timeout: 10000 });
            } catch {}
            try {
              await page.waitForFunction(() =>
                document.querySelectorAll('[instance-id], [data-key], button, a, input').length > 3,
                { timeout: 5000 }
              );
            } catch { await page.waitForTimeout(500); }
            // Count elements
            const counts = await page.evaluate(() => ({
              instanceIds: document.querySelectorAll('[instance-id]').length,
              dataKeys: document.querySelectorAll('[data-key]').length,
              inputs: document.querySelectorAll('input, textarea').length,
              buttons: document.querySelectorAll('button, [role="button"]').length,
              total: document.querySelectorAll('*').length,
            }));
            return { opened: input.url, title: await page.title(), elements: counts };
          }

          case 'click': {
            if (!input.selector) return { error: 'selector required' };
            const loc = await resolveSelector(page, input.selector);
            if (!loc) return { error: `Selector not resolved: ${input.selector}` };
            try {
              await loc.waitFor({ state: 'visible', timeout: 6000 });
              await loc.scrollIntoViewIfNeeded().catch(() => {});
              await loc.click({ timeout: 8000 });
              await page.waitForTimeout(300);
              return { clicked: input.selector };
            } catch (e1) {
              // Force click fallback
              try {
                await loc.click({ force: true, timeout: 3000 });
                await page.waitForTimeout(300);
                return { clicked: input.selector, strategy: 'force' };
              } catch (e2) {
                return { error: `Click failed: ${e1.message}`, selector: input.selector };
              }
            }
          }

          case 'fill': {
            if (!input.selector) return { error: 'selector required' };
            const loc = await resolveSelector(page, input.selector);
            if (!loc) return { error: `Selector not resolved: ${input.selector}` };
            const strategy = await vlFill(page, loc, input.value || '');
            await page.waitForTimeout(200);
            return { filled: input.selector, value: input.value, strategy };
          }

          case 'select': {
            if (!input.selector || !input.value) return { error: 'selector and value required' };
            const loc = await resolveSelector(page, input.selector);
            if (!loc) return { error: `Selector not resolved: ${input.selector}` };
            // VL dropdowns: click to open → click option text
            try {
              await loc.click({ timeout: 5000 });
              await page.waitForTimeout(500);
              await page.getByText(input.value, { exact: false }).first().click({ timeout: 5000 });
              await page.waitForTimeout(300);
              return { selected: input.value, from: input.selector };
            } catch (e) {
              return { error: `Select failed: ${e.message}` };
            }
          }

          case 'assert': {
            if (!input.selector) return { error: 'selector required' };
            const loc = await resolveSelector(page, input.selector);
            const type = input.assertType || 'visible';
            try {
              switch (type) {
                case 'visible':
                  await loc.waitFor({ state: 'visible', timeout: 5000 });
                  return { assert: 'visible', pass: true, selector: input.selector };
                case 'hidden':
                  await loc.waitFor({ state: 'hidden', timeout: 5000 });
                  return { assert: 'hidden', pass: true, selector: input.selector };
                case 'text': {
                  const text = await loc.textContent({ timeout: 5000 });
                  const pass = text?.includes(input.value || '');
                  return { assert: 'text', pass, expected: input.value, actual: text?.substring(0, 200) };
                }
                case 'count': {
                  const count = await loc.count();
                  return { assert: 'count', count, selector: input.selector };
                }
              }
            } catch (e) {
              return { assert: type, pass: false, error: e.message, selector: input.selector };
            }
          }

          case 'snapshot': {
            const snapshot = await page.evaluate((maxD) => {
              const SKIP = new Set(['script', 'style', 'link', 'meta', 'noscript', 'svg', 'path']);
              const walk = (el, d = 0) => {
                if (d > maxD) return '';
                const tag = el.tagName?.toLowerCase() || '';
                if (SKIP.has(tag)) return '';
                const iid = el.getAttribute?.('instance-id') || '';
                const dk = el.getAttribute?.('data-key') || '';
                const ph = el.getAttribute?.('placeholder') || '';
                const role = el.getAttribute?.('role') || '';
                let text = '';
                for (const n of el.childNodes) {
                  if (n.nodeType === 3 && n.textContent.trim()) { text = n.textContent.trim().slice(0, 60); break; }
                }
                let children = '';
                for (const c of el.children || []) children += walk(c, d + 1);
                const hasInfo = iid || dk || ph || role || text || tag === 'input' || tag === 'button' || tag === 'a';
                if (tag === 'div' && !hasInfo && el.children.length <= 1 && d > 3) return children;
                let line = '  '.repeat(Math.min(d, 12)) + `<${tag}`;
                if (iid) line += ` iid="${iid}"`;
                if (dk) line += ` dk="${dk}"`;
                if (ph) line += ` ph="${ph}"`;
                if (role) line += ` role="${role}"`;
                line += '>';
                if (text) line += ` ${text}`;
                return line + '\n' + children;
              };
              return walk(document.body);
            }, 25);
            return { snapshot: snapshot.substring(0, 8000), truncated: snapshot.length > 8000 };
          }

          case 'screenshot': {
            if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });
            const fname = (input.name || `vltest_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';
            const fpath = path.join(ssDir, fname);
            await page.screenshot({ path: fpath, fullPage: false });
            return { path: fpath, size: `${(fs.statSync(fpath).size / 1024).toFixed(1)}KB` };
          }

          case 'listIds': {
            const ids = await page.evaluate(() => {
              const els = document.querySelectorAll('[instance-id]');
              return Array.from(els).map(el => {
                const iid = el.getAttribute('instance-id');
                const tag = el.tagName.toLowerCase();
                const dk = el.getAttribute('data-key') || '';
                const text = el.textContent?.trim().substring(0, 40) || '';
                const vis = el.offsetParent !== null;
                return { iid, tag, dataKey: dk, text, visible: vis };
              });
            });
            return { count: ids.length, elements: ids.slice(0, 100) };
          }

          case 'run': {
            if (!input.steps?.length) return { error: 'steps array required' };
            const results = [];
            for (let i = 0; i < input.steps.length; i++) {
              const step = input.steps[i];
              const startMs = Date.now();
              try {
                // Recursive call to execute each step
                const stepResult = await tool.execute({ ...step, headless: input.headless });
                results.push({
                  index: i, action: step.action, selector: step.selector,
                  status: stepResult.error ? 'failed' : 'passed',
                  result: stepResult, durationMs: Date.now() - startMs,
                  description: step.description || '',
                });
                if (stepResult.error) {
                  log('Run', `Step ${i + 1} FAILED: ${stepResult.error}`);
                  break; // Stop on first failure
                }
              } catch (e) {
                results.push({
                  index: i, action: step.action, selector: step.selector,
                  status: 'failed', error: e.message, durationMs: Date.now() - startMs,
                });
                break;
              }
            }
            const passed = results.filter(r => r.status === 'passed').length;
            return {
              total: input.steps.length, executed: results.length,
              passed, failed: results.length - passed,
              pass: passed === results.length,
              steps: results,
            };
          }

          default:
            return { error: `Unknown action: ${input.action}` };
        }
      } catch (err) {
        return { error: `VLComponentTest error: ${err.message}` };
      }
    },
  };
  return tool;
}

export async function closeTestBrowser() {
  if (_browser) { try { await _browser.close(); } catch {} _browser = null; _page = null; }
}
