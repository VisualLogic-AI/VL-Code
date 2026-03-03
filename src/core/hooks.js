/**
 * Hooks System — user-defined pre/post operation hooks
 *
 * Hooks are defined in `.vl-code/hooks.json`:
 * {
 *   "pre": {
 *     "EditFile": "node scripts/lint-check.js ${file_path}",
 *     "WriteFile": "echo 'Writing ${file_path}'",
 *     "Bash": null  // null = block this tool entirely
 *   },
 *   "post": {
 *     "EditFile": "node scripts/auto-format.js ${file_path}",
 *     "VLParse": "echo 'Deploy complete'"
 *   },
 *   "events": {
 *     "pre-validate": "echo 'About to validate ${file_path}'",
 *     "post-validate": "echo 'Validation done: ${result}'",
 *     "pre-generate": "node scripts/check-ready.js",
 *     "post-generate": "node scripts/post-gen.js ${file_path}",
 *     "pre-edit": "echo 'Editing ${file_path}'",
 *     "post-edit": "node scripts/auto-lint.js ${file_path}"
 *   },
 *   "rules": [
 *     { "pattern": "*.vdb", "tools": ["EditFile", "WriteFile"], "action": "confirm" },
 *     { "pattern": "Services/*", "tools": ["EditFile"], "pre": "npm test" }
 *   ]
 * }
 *
 * Variable substitution: ${file_path}, ${command}, ${pattern}, ${tool_name}, ${result}
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class HooksManager {
  constructor(workDir) {
    this.workDir = workDir;
    this.config = { pre: {}, post: {}, rules: [] };
    this.load();
  }

  load() {
    // Try .vl-code/hooks.json
    const hooksFile = path.join(this.workDir, '.vl-code', 'hooks.json');
    if (fs.existsSync(hooksFile)) {
      try {
        this.config = JSON.parse(fs.readFileSync(hooksFile, 'utf-8'));
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }

  /**
   * Run pre-tool hook. Returns { blocked: true, reason } to prevent execution.
   */
  async runPre(toolName, input) {
    // Check if tool is blocked
    if (this.config.pre && this.config.pre[toolName] === null) {
      return { blocked: true, reason: `Tool ${toolName} is blocked by hooks configuration.` };
    }

    // Check file-based rules
    const filePath = input?.file_path || input?.path || '';
    for (const rule of this.config.rules || []) {
      if (this._matchesRule(rule, toolName, filePath)) {
        if (rule.action === 'block') {
          return { blocked: true, reason: `Blocked by rule: ${rule.pattern}` };
        }
        if (rule.action === 'confirm') {
          return { blocked: true, reason: `Requires confirmation: editing ${rule.pattern} files` };
        }
        if (rule.pre) {
          const result = this._exec(rule.pre, { file_path: filePath, tool_name: toolName });
          if (!result.ok) {
            return { blocked: true, reason: `Pre-hook failed: ${result.error}` };
          }
        }
      }
    }

    // Run global pre-hook for this tool
    const preCmd = this.config.pre?.[toolName];
    if (preCmd && typeof preCmd === 'string') {
      const result = this._exec(preCmd, { ...input, tool_name: toolName });
      if (!result.ok) {
        return { blocked: true, reason: `Pre-hook failed: ${result.error}` };
      }
    }

    return { blocked: false };
  }

  /**
   * Run post-tool hook (fire-and-forget, doesn't block).
   */
  async runPost(toolName, input, output) {
    // Check file-based rules
    const filePath = input?.file_path || input?.path || '';
    for (const rule of this.config.rules || []) {
      if (this._matchesRule(rule, toolName, filePath) && rule.post) {
        this._exec(rule.post, { file_path: filePath, tool_name: toolName, output: output?.substring(0, 200) });
      }
    }

    // Run global post-hook
    const postCmd = this.config.post?.[toolName];
    if (postCmd && typeof postCmd === 'string') {
      this._exec(postCmd, { ...input, tool_name: toolName, output: output?.substring(0, 200) });
    }
  }

  /** Check if a rule matches the given tool and file */
  _matchesRule(rule, toolName, filePath) {
    if (rule.tools && !rule.tools.includes(toolName)) return false;
    if (rule.pattern && filePath) {
      // Simple glob matching (supports * and **)
      const regex = new RegExp('^' + rule.pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
      const relativePath = path.relative(this.workDir, filePath);
      return regex.test(relativePath) || regex.test(path.basename(filePath));
    }
    return !rule.pattern; // No pattern = matches all
  }

  /** Execute a shell command with variable substitution */
  _exec(cmd, vars = {}) {
    let resolved = cmd;
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === 'string') {
        resolved = resolved.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      }
    }
    try {
      execSync(resolved, { cwd: this.workDir, timeout: 10000, stdio: 'pipe' });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.stderr?.toString() || err.message };
    }
  }

  /**
   * Run an event hook (semantic lifecycle hooks beyond tool pre/post).
   * Events: pre-validate, post-validate, pre-generate, post-generate, pre-edit, post-edit
   * @returns {{ blocked: boolean, reason?: string }}
   */
  async runEvent(eventName, vars = {}) {
    const cmd = this.config.events?.[eventName];
    if (!cmd || typeof cmd !== 'string') return { blocked: false };
    const result = this._exec(cmd, { ...vars, event: eventName });
    if (!result.ok) {
      return { blocked: true, reason: `Event hook ${eventName} failed: ${result.error}` };
    }
    return { blocked: false };
  }

  /** Check if hooks are configured */
  hasHooks() {
    return Object.keys(this.config.pre || {}).length > 0 ||
           Object.keys(this.config.post || {}).length > 0 ||
           Object.keys(this.config.events || {}).length > 0 ||
           (this.config.rules || []).length > 0;
  }
}
