/**
 * WriteFile Tool - creates or overwrites files
 * Enhanced: atomic write (temp+rename), permission check, size reporting
 */
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

export function createWriteFileTool(config) {
  return {
    description: 'Create a new file or overwrite an existing file. Uses atomic write (temp file + rename) to prevent corruption.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['file_path', 'content'],
    },
    execute: async (input) => {
      const filePath = path.resolve(config.workDir, input.file_path);
      const dir = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Check if overwriting
      let isNew = true;
      try {
        await fs.access(filePath);
        isNew = false;
      } catch {
        // File doesn't exist, that's fine
      }

      // Atomic write: write to temp file then rename
      const tmpSuffix = randomBytes(4).toString('hex');
      const tmpPath = `${filePath}.tmp_${tmpSuffix}`;

      try {
        await fs.writeFile(tmpPath, input.content, 'utf-8');
        await fs.rename(tmpPath, filePath);
      } catch (e) {
        // Clean up temp file on failure
        await fs.unlink(tmpPath).catch(() => {});
        if (e.code === 'EACCES') return { error: `Permission denied: ${input.file_path}` };
        return { error: `Write failed: ${e.message}` };
      }

      const lines = input.content.split('\n').length;
      const action = isNew ? 'Created' : 'Wrote';
      return { result: `${action} ${input.file_path} (${input.content.length} chars, ${lines} lines)` };
    },
  };
}
