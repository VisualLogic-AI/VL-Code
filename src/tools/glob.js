/**
 * Glob Tool - file name pattern matching
 * Mirrors Claude Code's Glob tool: returns files sorted by modification time
 */
import fs from 'fs/promises';
import path from 'path';

export function createGlobTool(config) {
  return {
    description: 'Find files matching a glob pattern. Returns file paths sorted by modification time (newest first).',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern (e.g., "**/*.vx", "Sections/*.sc")',
        },
        path: {
          type: 'string',
          description: 'Directory to search in (default: working directory)',
        },
      },
      required: ['pattern'],
    },
    execute: async (input) => {
      const searchPath = input.path ? path.resolve(config.workDir, input.path) : config.workDir;

      // Use node's native glob (Node 22+) or fallback to recursive walk
      try {
        const matches = await globMatch(searchPath, input.pattern);

        // Sort by mtime (newest first)
        const withStats = await Promise.all(
          matches.map(async (f) => {
            try {
              const stat = await fs.stat(f);
              return { path: f, mtime: stat.mtimeMs };
            } catch {
              return { path: f, mtime: 0 };
            }
          })
        );
        withStats.sort((a, b) => b.mtime - a.mtime);

        // Return relative paths
        const result = withStats.map(f =>
          f.path.replace(config.workDir + '/', '')
        );

        return result.length > 0 ? result.join('\n') : 'No files matched.';
      } catch (err) {
        return `Error: ${err.message}`;
      }
    },
  };
}

async function globMatch(dir, pattern) {
  // Simple recursive glob implementation
  const results = [];
  const parts = pattern.split('/');

  async function walk(currentDir, patternParts) {
    if (patternParts.length === 0) return;

    const [current, ...rest] = patternParts;

    if (current === '**') {
      // Recursive: search all subdirectories
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.name.startsWith('.')) continue; // Skip hidden

        if (entry.isDirectory()) {
          await walk(fullPath, patternParts); // Keep ** pattern
          await walk(fullPath, rest); // Move past **
        } else if (rest.length === 0 || (rest.length === 1 && matchGlob(entry.name, rest[0]))) {
          // ** at end or ** followed by filename pattern
          if (rest.length === 0 || matchGlob(entry.name, rest[0])) {
            results.push(fullPath);
          }
        }
      }
      // Also check files in current dir
      if (rest.length === 1) {
        const entries2 = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries2) {
          if (entry.isFile() && matchGlob(entry.name, rest[0])) {
            const fullPath = path.join(currentDir, entry.name);
            if (!results.includes(fullPath)) results.push(fullPath);
          }
        }
      }
    } else if (rest.length === 0) {
      // Leaf pattern: match files
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (matchGlob(entry.name, current)) {
          results.push(path.join(currentDir, entry.name));
        }
      }
    } else {
      // Directory pattern: descend
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && matchGlob(entry.name, current)) {
          await walk(path.join(currentDir, entry.name), rest);
        }
      }
    }
  }

  await walk(dir, parts);
  return [...new Set(results)]; // Deduplicate
}

function matchGlob(name, pattern) {
  // Simple glob matching: * matches anything, {a,b} matches alternatives
  let regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\{([^}]+)\}/g, (_, alts) => `(${alts.split(',').join('|')})`);
  return new RegExp(`^${regex}$`).test(name);
}
