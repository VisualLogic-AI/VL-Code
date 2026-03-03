/**
 * Browser Inspect Tool — Playwright-powered self-testing for VL-Code IDE
 *
 * Provides the AI with eyes into the browser:
 *   screenshot    — capture full page or element screenshot (returns base64 PNG)
 *   console       — get browser console logs (errors, warnings, info)
 *   network       — get recent network requests/responses
 *   evaluate      — execute JavaScript in the browser context
 *   element       — get element info (text, visibility, bounds, attributes)
 *   click         — click an element by CSS selector
 *   navigate      — navigate to a URL or reload
 *   waitFor       — wait for an element to appear
 *
 * The tool maintains a persistent browser instance (lazy-init on first use).
 * It automatically navigates to the VL-Code IDE on startup.
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';

let _browser = null;
let _page = null;
let _consoleLogs = [];
let _networkLogs = [];
const MAX_LOGS = 200;

async function ensureBrowser(port) {
  if (_browser && _page) {
    try { await _page.evaluate(() => true); return _page; } catch { /* page closed, reopen */ }
  }

  if (_browser) {
    try { await _browser.close(); } catch {}
  }

  _browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const context = await _browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  _page = await context.newPage();

  // Capture console logs
  _consoleLogs = [];
  _page.on('console', msg => {
    _consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString(),
      location: msg.location(),
    });
    if (_consoleLogs.length > MAX_LOGS) _consoleLogs.shift();
  });

  // Capture page errors
  _page.on('pageerror', err => {
    _consoleLogs.push({
      type: 'error',
      text: `[PageError] ${err.message}`,
      time: new Date().toISOString(),
    });
  });

  // Capture network
  _networkLogs = [];
  _page.on('request', req => {
    _networkLogs.push({
      type: 'request',
      method: req.method(),
      url: req.url(),
      time: new Date().toISOString(),
    });
    if (_networkLogs.length > MAX_LOGS) _networkLogs.shift();
  });
  _page.on('response', res => {
    _networkLogs.push({
      type: 'response',
      status: res.status(),
      url: res.url(),
      time: new Date().toISOString(),
    });
    if (_networkLogs.length > MAX_LOGS) _networkLogs.shift();
  });

  // Navigate to IDE (use domcontentloaded — SSE keeps networkidle from ever firing)
  const url = `http://localhost:${port || 3200}`;
  await _page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait for the app to initialize
  await _page.waitForSelector('#fileTree', { timeout: 8000 }).catch(() => {});

  return _page;
}

export function createBrowserInspectTool(config) {
  const screenshotDir = path.join(os.homedir(), '.vl-code', 'screenshots');

  return {
    description: `Browser automation tool for self-testing the VL-Code IDE.
Use this to visually verify UI changes, read console errors, check network requests, and interact with the IDE.
Actions: screenshot, console, network, evaluate, element, click, navigate, waitFor`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['screenshot', 'console', 'network', 'evaluate', 'element', 'click', 'navigate', 'waitFor'],
          description: 'Action to perform',
        },
        // screenshot params
        selector: { type: 'string', description: 'CSS selector for element screenshot (optional, defaults to full page)' },
        name: { type: 'string', description: 'Screenshot filename (without extension). Saved to ~/.vl-code/screenshots/' },
        // evaluate params
        expression: { type: 'string', description: 'JavaScript expression to evaluate in browser context' },
        // element params — uses selector
        // click params — uses selector
        // navigate params
        url: { type: 'string', description: 'URL to navigate to (navigate action), or "reload" to reload current page' },
        // waitFor params — uses selector
        timeout: { type: 'number', description: 'Timeout in ms (waitFor/navigate, default 5000)' },
        // console/network filters
        filter: { type: 'string', description: 'Filter logs: "error", "warning", "info" (console) or URL substring (network)' },
      },
      required: ['action'],
    },
    execute: async (input) => {
      try {
        const page = await ensureBrowser(config.port || 3200);

        switch (input.action) {
          case 'screenshot': {
            if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
            const fname = (input.name || `screenshot_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';
            const fpath = path.join(screenshotDir, fname);
            if (input.selector) {
              const el = await page.$(input.selector);
              if (!el) return { error: `Element not found: ${input.selector}` };
              await el.screenshot({ path: fpath });
            } else {
              await page.screenshot({ path: fpath, fullPage: false });
            }
            // Return path + base64 for the AI to view
            const buf = fs.readFileSync(fpath);
            return {
              path: fpath,
              size: `${(buf.length / 1024).toFixed(1)}KB`,
              base64: buf.toString('base64').substring(0, 100) + '...',
              message: `Screenshot saved: ${fpath}`,
            };
          }

          case 'console': {
            let logs = [..._consoleLogs];
            if (input.filter) {
              const f = input.filter.toLowerCase();
              logs = logs.filter(l => l.type === f || l.text.toLowerCase().includes(f));
            }
            // Return last 50 most recent
            return { logs: logs.slice(-50), total: _consoleLogs.length };
          }

          case 'network': {
            let logs = [..._networkLogs];
            if (input.filter) {
              const f = input.filter.toLowerCase();
              logs = logs.filter(l => l.url.toLowerCase().includes(f));
            }
            return { logs: logs.slice(-50), total: _networkLogs.length };
          }

          case 'evaluate': {
            if (!input.expression) return { error: 'expression required' };
            const result = await page.evaluate(input.expression);
            return { result: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) };
          }

          case 'element': {
            if (!input.selector) return { error: 'selector required' };
            const el = await page.$(input.selector);
            if (!el) return { error: `Element not found: ${input.selector}`, exists: false };
            const info = await el.evaluate(node => ({
              tagName: node.tagName,
              id: node.id,
              className: node.className,
              text: node.textContent?.substring(0, 500),
              innerHTML: node.innerHTML?.substring(0, 1000),
              visible: node.offsetParent !== null || getComputedStyle(node).position === 'fixed',
              bounds: node.getBoundingClientRect().toJSON(),
              childCount: node.children.length,
              attributes: Object.fromEntries([...node.attributes].map(a => [a.name, a.value.substring(0, 200)])),
            }));
            return { exists: true, ...info };
          }

          case 'click': {
            if (!input.selector) return { error: 'selector required' };
            await page.click(input.selector, { timeout: input.timeout || 5000 });
            // Brief wait for UI to settle
            await page.waitForTimeout(300);
            return { clicked: input.selector };
          }

          case 'navigate': {
            if (input.url === 'reload') {
              await page.reload({ waitUntil: 'domcontentloaded', timeout: input.timeout || 10000 });
              return { navigated: 'reload', url: page.url() };
            }
            const target = input.url || `http://localhost:${config.port || 3200}`;
            await page.goto(target, { waitUntil: 'domcontentloaded', timeout: input.timeout || 10000 });
            return { navigated: target, url: page.url() };
          }

          case 'waitFor': {
            if (!input.selector) return { error: 'selector required' };
            try {
              await page.waitForSelector(input.selector, { timeout: input.timeout || 5000 });
              return { found: true, selector: input.selector };
            } catch {
              return { found: false, selector: input.selector, message: 'Timeout — element not found' };
            }
          }

          default:
            return { error: `Unknown action: ${input.action}` };
        }
      } catch (err) {
        return { error: `BrowserInspect error: ${err.message}` };
      }
    },
  };
}

/** Cleanup — call on server shutdown */
export async function closeBrowser() {
  if (_browser) {
    try { await _browser.close(); } catch {}
    _browser = null;
    _page = null;
  }
}
