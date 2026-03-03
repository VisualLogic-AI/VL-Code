/**
 * Memory Tool — cross-session and project-level memory for the LLM
 *
 * Two scopes:
 *   - global: ~/.vl-code/memory/ (persists across all projects)
 *   - project: <workDir>/.vl-code/memory/ (project-specific)
 *
 * Operations: read, write, append, list, delete, search
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

export function createMemoryTool(config) {
  const globalDir = path.join(os.homedir(), '.vl-code', 'memory');
  const projectDir = path.join(config.workDir, '.vl-code', 'memory');

  function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function getDir(scope) {
    return scope === 'global' ? globalDir : projectDir;
  }

  return {
    description: `Read, write, and search persistent memory. Use this to remember important context across sessions — user preferences, architectural decisions, debugging insights, recurring patterns. Two scopes: "global" (across all projects) and "project" (current project only).`,
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['read', 'write', 'append', 'list', 'delete', 'search'],
          description: 'The memory operation to perform.',
        },
        scope: {
          type: 'string',
          enum: ['global', 'project'],
          description: 'Memory scope. Default: "project".',
          default: 'project',
        },
        key: {
          type: 'string',
          description: 'Memory key (file name without extension). Used for read/write/append/delete.',
        },
        value: {
          type: 'string',
          description: 'Content to write or append.',
        },
        query: {
          type: 'string',
          description: 'Search query (for "search" operation). Searches across all memory files in the scope.',
        },
      },
      required: ['operation'],
    },
    execute: async (input) => {
      const { operation, scope = 'project', key, value, query } = input;
      const dir = getDir(scope);
      ensureDir(dir);

      switch (operation) {
        case 'read': {
          if (!key) return 'Error: key is required for read';
          const filePath = path.join(dir, `${key}.md`);
          if (!fs.existsSync(filePath)) return `Memory "${key}" not found in ${scope} scope.`;
          return fs.readFileSync(filePath, 'utf-8');
        }

        case 'write': {
          if (!key) return 'Error: key is required for write';
          if (!value) return 'Error: value is required for write';
          const filePath = path.join(dir, `${key}.md`);
          const header = `<!-- Memory: ${key} | Scope: ${scope} | Updated: ${new Date().toISOString()} -->\n`;
          fs.writeFileSync(filePath, header + value, 'utf-8');
          return `Memory "${key}" saved to ${scope} scope (${value.length} chars).`;
        }

        case 'append': {
          if (!key) return 'Error: key is required for append';
          if (!value) return 'Error: value is required for append';
          const filePath = path.join(dir, `${key}.md`);
          const timestamp = `\n\n---\n_${new Date().toISOString().split('T')[0]}_\n`;
          fs.appendFileSync(filePath, timestamp + value, 'utf-8');
          return `Appended to memory "${key}" in ${scope} scope.`;
        }

        case 'list': {
          const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')) : [];
          if (files.length === 0) return `No memories in ${scope} scope.`;
          const items = files.map(f => {
            const stat = fs.statSync(path.join(dir, f));
            return `- ${f.replace('.md', '')} (${stat.size} bytes, updated ${stat.mtime.toISOString().split('T')[0]})`;
          });
          return `${scope} memories (${files.length}):\n${items.join('\n')}`;
        }

        case 'delete': {
          if (!key) return 'Error: key is required for delete';
          const filePath = path.join(dir, `${key}.md`);
          if (!fs.existsSync(filePath)) return `Memory "${key}" not found.`;
          fs.unlinkSync(filePath);
          return `Memory "${key}" deleted from ${scope} scope.`;
        }

        case 'search': {
          if (!query) return 'Error: query is required for search';
          const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')) : [];
          const results = [];
          const q = query.toLowerCase();
          for (const f of files) {
            const content = fs.readFileSync(path.join(dir, f), 'utf-8');
            if (content.toLowerCase().includes(q)) {
              const lines = content.split('\n');
              const matchLines = lines.filter(l => l.toLowerCase().includes(q)).slice(0, 3);
              results.push(`## ${f.replace('.md', '')}\n${matchLines.join('\n')}`);
            }
          }
          if (results.length === 0) return `No matches for "${query}" in ${scope} scope.`;
          return `Found ${results.length} matching memories:\n\n${results.join('\n\n')}`;
        }

        default:
          return `Unknown operation: ${operation}`;
      }
    },
  };
}
