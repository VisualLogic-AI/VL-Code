/**
 * EditFile Tool - performs exact string replacements in files
 * Enhanced: atomic write, diff preview, line number reporting
 */
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

export function createEditFileTool(config) {
  return {
    description: 'Edit a file by replacing an exact string match. old_string must be unique unless replace_all is true. Uses atomic writes.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the file to edit',
        },
        old_string: {
          type: 'string',
          description: 'The exact text to find and replace',
        },
        new_string: {
          type: 'string',
          description: 'The replacement text',
        },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences (default: false)',
        },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
    execute: async (input) => {
      const filePath = path.resolve(config.workDir, input.file_path);

      // Read current content
      let content;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        if (e.code === 'ENOENT') return { error: `File not found: ${input.file_path}` };
        if (e.code === 'EACCES') return { error: `Permission denied: ${input.file_path}` };
        return { error: `Cannot read ${input.file_path}: ${e.message}` };
      }

      if (input.old_string === input.new_string) {
        return { error: 'old_string and new_string are identical.' };
      }

      const count = content.split(input.old_string).length - 1;

      if (count === 0) {
        // Provide helpful hint: show closest match
        const snippet = input.old_string.substring(0, 40);
        return { error: `old_string not found in ${input.file_path}. Searched for: "${snippet}${input.old_string.length > 40 ? '...' : ''}"` };
      }

      if (count > 1 && !input.replace_all) {
        return { error: `old_string found ${count} times. Provide more context to make it unique, or set replace_all: true.` };
      }

      // Find line number of first match
      const beforeMatch = content.indexOf(input.old_string);
      const lineNum = content.substring(0, beforeMatch).split('\n').length;

      // Apply replacement
      let newContent;
      if (input.replace_all) {
        newContent = content.replaceAll(input.old_string, input.new_string);
      } else {
        newContent = content.replace(input.old_string, input.new_string);
      }

      // Atomic write
      const tmpSuffix = randomBytes(4).toString('hex');
      const tmpPath = `${filePath}.tmp_${tmpSuffix}`;
      try {
        await fs.writeFile(tmpPath, newContent, 'utf-8');
        await fs.rename(tmpPath, filePath);
      } catch (e) {
        await fs.unlink(tmpPath).catch(() => {});
        return { error: `Write failed: ${e.message}` };
      }

      const replacements = input.replace_all ? `${count} replacements` : `1 replacement at line ${lineNum}`;
      return { result: `Edited ${input.file_path} (${replacements})` };
    },
  };
}
