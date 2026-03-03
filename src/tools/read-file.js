/**
 * ReadFile Tool - reads files from local filesystem
 * Enhanced: symlink resolution, binary detection, large file handling, encoding fallback
 */
import fs from 'fs/promises';
import path from 'path';

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
  '.mp3', '.mp4', '.wav', '.ogg', '.avi', '.mov',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.exe', '.dll', '.so', '.dylib', '.wasm',
  '.ttf', '.otf', '.woff', '.woff2',
]);

export function createReadFileTool(config) {
  return {
    description: 'Read a file from the local filesystem. Supports partial reads with offset and limit. Returns content with line numbers. Detects binary files and resolves symlinks.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute or relative path to the file to read',
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from (1-indexed)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to read (default: 2000)',
        },
      },
      required: ['file_path'],
    },
    execute: async (input) => {
      const filePath = path.resolve(config.workDir, input.file_path);

      // Check file exists
      let stat;
      try {
        stat = await fs.stat(filePath); // follows symlinks
      } catch (e) {
        if (e.code === 'ENOENT') return { error: `File not found: ${input.file_path}` };
        if (e.code === 'EACCES') return { error: `Permission denied: ${input.file_path}` };
        return { error: `Cannot access ${input.file_path}: ${e.message}` };
      }

      if (stat.isDirectory()) {
        return { error: `${input.file_path} is a directory. Use Glob to list files.` };
      }

      // Binary detection
      const ext = path.extname(filePath).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) {
        const sizeKB = (stat.size / 1024).toFixed(1);
        return { result: `[Binary file: ${ext} ${sizeKB}KB]` };
      }

      // Large file guard
      if (stat.size > 2 * 1024 * 1024 && !input.offset && !input.limit) {
        return { error: `File is ${(stat.size / (1024 * 1024)).toFixed(1)}MB. Use offset/limit for partial reads.` };
      }

      // Read with encoding fallback
      let content;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        try {
          content = await fs.readFile(filePath, 'latin1');
        } catch (e2) {
          return { error: `Failed to read: ${e2.message}` };
        }
      }

      const lines = content.split('\n');
      const offset = (input.offset || 1) - 1;
      const limit = input.limit || 2000;
      const selected = lines.slice(offset, offset + limit);

      const formatted = selected.map((line, i) => {
        const lineNum = offset + i + 1;
        const truncated = line.length > 2000 ? line.substring(0, 2000) + '...' : line;
        return `${String(lineNum).padStart(6)}\t${truncated}`;
      }).join('\n');

      let result = formatted;
      if (lines.length > offset + limit) {
        result += `\n[Lines ${offset + 1}-${offset + limit} of ${lines.length}]`;
      }

      return { result };
    },
  };
}
