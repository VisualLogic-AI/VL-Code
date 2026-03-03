/**
 * Grep Tool - content search using ripgrep or native grep
 * Mirrors Claude Code's Grep tool: regex support, output modes, context lines
 */
import { exec } from 'child_process';
import path from 'path';

export function createGrepTool(config) {
  return {
    description: 'Search file contents using regex patterns. Default mode returns only matching file paths (saves context). Use output_mode "content" to see matching lines.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regular expression pattern to search for',
        },
        path: {
          type: 'string',
          description: 'Directory or file to search in (default: working directory)',
        },
        output_mode: {
          type: 'string',
          enum: ['files_with_matches', 'content', 'count'],
          description: 'Output mode (default: files_with_matches)',
        },
        glob: {
          type: 'string',
          description: 'File pattern filter (e.g., "*.vx", "*.{sc,cp}")',
        },
        context: {
          type: 'number',
          description: 'Lines of context around matches (for content mode)',
        },
        case_insensitive: {
          type: 'boolean',
          description: 'Case insensitive search',
        },
        head_limit: {
          type: 'number',
          description: 'Limit number of results',
        },
      },
      required: ['pattern'],
    },
    execute: async (input) => {
      const searchPath = input.path ? path.resolve(config.workDir, input.path) : config.workDir;
      const mode = input.output_mode || 'files_with_matches';

      // Build grep/rg command
      let cmd;
      const hasRg = await checkCommand('rg --version');

      if (hasRg) {
        // Use ripgrep (faster)
        cmd = `rg "${escapeShell(input.pattern)}"`;
        if (mode === 'files_with_matches') cmd += ' -l';
        if (mode === 'count') cmd += ' -c';
        if (input.glob) cmd += ` --glob "${input.glob}"`;
        if (input.case_insensitive) cmd += ' -i';
        if (input.context && mode === 'content') cmd += ` -C ${input.context}`;
        if (input.head_limit) cmd += ` | head -n ${input.head_limit}`;
        cmd += ` "${searchPath}"`;
      } else {
        // Fallback to grep
        cmd = `grep -r "${escapeShell(input.pattern)}"`;
        if (mode === 'files_with_matches') cmd += ' -l';
        if (mode === 'count') cmd += ' -c';
        if (input.case_insensitive) cmd += ' -i';
        if (input.context && mode === 'content') cmd += ` -C ${input.context}`;
        if (input.glob) cmd += ` --include="${input.glob}"`;
        cmd += ` "${searchPath}"`;
        if (input.head_limit) cmd += ` | head -n ${input.head_limit}`;
      }

      return new Promise(resolve => {
        exec(cmd, { cwd: config.workDir, maxBuffer: 1024 * 1024 * 5, timeout: 30000 }, (error, stdout) => {
          if (!stdout || stdout.trim() === '') {
            resolve('No matches found.');
            return;
          }
          // Make paths relative
          const result = stdout.replace(new RegExp(escapeRegex(config.workDir + '/'), 'g'), '');
          resolve(result.trim());
        });
      });
    },
  };
}

function checkCommand(cmd) {
  return new Promise(resolve => {
    exec(cmd, (error) => resolve(!error));
  });
}

function escapeShell(s) {
  return s.replace(/[\\'"$`]/g, '\\$&');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
