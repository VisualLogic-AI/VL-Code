/**
 * Bash Tool - executes shell commands
 * Mirrors Claude Code's Bash tool with timeout support
 */
import { exec } from 'child_process';

export function createBashTool(config) {
  return {
    description: 'Execute a bash command and return its output. Use for system commands, npm, git, etc.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 120000)',
        },
      },
      required: ['command'],
    },
    execute: async (input) => {
      const timeout = input.timeout || 120000;

      return new Promise((resolve, reject) => {
        exec(input.command, {
          cwd: config.workDir,
          timeout,
          maxBuffer: 1024 * 1024 * 10, // 10MB
          shell: process.env.SHELL || '/bin/zsh',
        }, (error, stdout, stderr) => {
          if (error && error.killed) {
            resolve(`Command timed out after ${timeout}ms`);
            return;
          }
          const output = [];
          if (stdout) output.push(stdout);
          if (stderr) output.push(`STDERR: ${stderr}`);
          if (error) output.push(`Exit code: ${error.code}`);
          resolve(output.join('\n') || 'Command completed with no output.');
        });
      });
    },
  };
}
