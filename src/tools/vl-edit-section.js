/**
 * VL Section-Level Edit Tool – edit VL files by section name
 *
 * Instead of error-prone string matching (Claude Code's Edit tool),
 * VL-Code can edit by semantic section:
 *   - "Replace the entire # Frontend Tree section"
 *   - "Add a method to # Frontend Internal Methods"
 *   - "Clear # Frontend Event Handlers and replace with new content"
 *
 * This is VL's structural advantage: predictable section markers
 * make surgical section-level editing trivial and reliable.
 */
import fs from 'fs/promises';
import path from 'path';

export function createVLEditSectionTool(config) {
  return {
    description: 'Edit a specific section in a VL file by section name. More reliable than string replacement for VL files. Can replace entire sections, append to sections, or insert new sections.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the VL file to edit',
        },
        section_name: {
          type: 'string',
          description: 'Section header name, e.g. "Frontend Tree" or "Frontend Event Handlers"',
        },
        action: {
          type: 'string',
          enum: ['replace', 'append', 'prepend', 'insert_after'],
          description: 'How to modify the section: replace (full content), append (add to end), prepend (add to start), insert_after (insert new section after this one)',
        },
        content: {
          type: 'string',
          description: 'New content for the section (without the # header line)',
        },
        new_section_name: {
          type: 'string',
          description: 'For insert_after action: name of the new section to create',
        },
      },
      required: ['file_path', 'section_name', 'action', 'content'],
    },
    execute: async (input) => {
      const fullPath = path.resolve(config.workDir, input.file_path);
      let content;
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch (e) {
        return { error: `Cannot read file: ${e.message}` };
      }

      const lines = content.split('\n');
      const sectionName = input.section_name;

      // Find section boundaries
      let sectionStart = -1;
      let sectionEnd = -1;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#\s+(.+)$/);
        if (match && match[1].trim() === sectionName) {
          sectionStart = i;
        } else if (match && sectionStart >= 0 && sectionEnd < 0) {
          sectionEnd = i;
        }
      }

      if (sectionStart < 0) {
        return { error: `Section "# ${sectionName}" not found in ${input.file_path}` };
      }

      // If section goes to end of file
      if (sectionEnd < 0) sectionEnd = lines.length;

      const newContentLines = input.content.split('\n');

      let result;
      switch (input.action) {
        case 'replace': {
          const before = lines.slice(0, sectionStart + 1); // Include # header
          const after = lines.slice(sectionEnd);
          result = [...before, ...newContentLines, ...after];
          break;
        }
        case 'append': {
          const before = lines.slice(0, sectionEnd);
          const after = lines.slice(sectionEnd);
          result = [...before, ...newContentLines, ...after];
          break;
        }
        case 'prepend': {
          const before = lines.slice(0, sectionStart + 1);
          const middle = lines.slice(sectionStart + 1, sectionEnd);
          const after = lines.slice(sectionEnd);
          result = [...before, ...newContentLines, ...middle, ...after];
          break;
        }
        case 'insert_after': {
          const before = lines.slice(0, sectionEnd);
          const after = lines.slice(sectionEnd);
          const newHeader = `# ${input.new_section_name || 'New Section'}`;
          result = [...before, '', newHeader, ...newContentLines, ...after];
          break;
        }
        default:
          return { error: `Unknown action: ${input.action}` };
      }

      const newContent = result.join('\n');
      await fs.writeFile(fullPath, newContent, 'utf-8');

      const linesChanged = Math.abs(result.length - lines.length);
      return {
        result: `Section "# ${sectionName}" ${input.action}d in ${input.file_path} (${linesChanged} lines changed, ${result.length} total)`,
      };
    },
  };
}
