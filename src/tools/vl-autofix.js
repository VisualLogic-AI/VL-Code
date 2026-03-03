/**
 * VL Auto-Fix Tool – automatically fix VL syntax issues
 *
 * VL's strict rules make automated fixes possible. This tool can:
 *   - Fix a single file and show what changed
 *   - Fix all files and report results
 *   - Preview fixes without applying them
 */

export function createVLAutoFixTool(autoFix) {
  return {
    description: 'Automatically fix common VL syntax issues: missing version headers, space-to-dash indentation, section ordering, escape characters, naming conventions. Preview changes before applying.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to VL file to fix, or "all" for entire project',
        },
        preview: {
          type: 'boolean',
          description: 'If true, show what would be fixed without applying changes (default: false)',
        },
      },
      required: ['file_path'],
    },
    execute: async (input) => {
      if (!autoFix) return { error: 'Auto-fix engine not available.' };

      if (input.file_path === 'all') {
        if (input.preview) {
          const result = await autoFix.fixAll();
          if (result.filesFixed === 0) return { result: 'All files are clean. No fixes needed.' };
          const text = result.results.map(r =>
            `${r.file}: ${r.changes.length} fixes\n${r.changes.map(c => `  - ${c.description}`).join('\n')}`
          ).join('\n\n');
          return { result: `Preview: ${result.totalChanges} fixes in ${result.filesFixed} files:\n\n${text}` };
        }

        // Fix and save all
        const allFiles = autoFix.ctx.getAllFiles();
        let totalChanges = 0;
        const results = [];
        for (const file of allFiles) {
          const result = await autoFix.fixAndSave(file.path);
          if (result.fixed) {
            results.push({ file: file.path, changes: result.changes });
            totalChanges += result.changes.length;
          }
        }

        if (results.length === 0) return { result: 'All files are clean. No fixes needed.' };
        const text = results.map(r =>
          `${r.file}: ${r.changes.length} fixes applied`
        ).join('\n');
        return { result: `Fixed ${totalChanges} issues in ${results.length} files:\n${text}` };
      }

      // Single file
      if (input.preview) {
        const result = await autoFix.fix(input.file_path);
        if (result.error) return { error: result.error };
        if (!result.fixed) return { result: `${input.file_path}: No fixes needed.` };
        return {
          result: `Preview for ${input.file_path}: ${result.changes.length} fixes:\n` +
            result.changes.map(c => `  - ${c.description}`).join('\n'),
        };
      }

      const result = await autoFix.fixAndSave(input.file_path);
      if (result.error) return { error: result.error };
      if (!result.fixed) return { result: `${input.file_path}: No fixes needed.` };
      return {
        result: `Fixed ${result.changes.length} issues in ${input.file_path}:\n` +
          result.changes.map(c => `  - ${c.description}`).join('\n'),
      };
    },
  };
}
