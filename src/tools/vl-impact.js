/**
 * VL Impact Analysis Tool – detect breaking changes before they happen
 *
 * This tool answers questions Claude Code cannot:
 *   - "What breaks if I rename this method?"
 *   - "What sections call this service?"
 *   - "Are there any broken references in the project?"
 *   - "What's the blast radius of this change?"
 */

export function createVLImpactTool(impactAnalyzer) {
  return {
    description: 'Analyze the impact of proposed VL code changes: detect breaking references, find affected files, validate project integrity. Use before making changes to understand the blast radius.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['removal', 'rename', 'service_change', 'component_change', 'full_scan'],
          description: 'Type of impact analysis',
        },
        symbol_name: {
          type: 'string',
          description: 'Symbol being changed (for removal, rename)',
        },
        new_name: {
          type: 'string',
          description: 'New name (for rename action)',
        },
        service_domain: {
          type: 'string',
          description: 'Service domain name (for service_change)',
        },
        method_name: {
          type: 'string',
          description: 'Method name (for service_change)',
        },
        component_name: {
          type: 'string',
          description: 'Component name (for component_change)',
        },
        change_type: {
          type: 'string',
          enum: ['remove_prop', 'add_required_prop', 'remove_event', 'change_interface'],
          description: 'Type of component change',
        },
      },
      required: ['action'],
    },
    execute: async (input) => {
      if (!impactAnalyzer) {
        return { error: 'Impact analyzer not available.' };
      }

      switch (input.action) {
        case 'removal': {
          if (!input.symbol_name) return { error: 'symbol_name required for removal analysis' };
          const result = impactAnalyzer.analyzeRemoval(input.symbol_name);
          return { result: formatImpactReport(result) };
        }

        case 'rename': {
          if (!input.symbol_name || !input.new_name) return { error: 'symbol_name and new_name required' };
          const result = impactAnalyzer.analyzeRename(input.symbol_name, input.new_name);
          return { result: formatImpactReport(result) };
        }

        case 'service_change': {
          if (!input.service_domain) return { error: 'service_domain required' };
          const result = impactAnalyzer.analyzeServiceChange(input.service_domain, input.method_name || '');
          return { result: formatImpactReport(result) };
        }

        case 'component_change': {
          if (!input.component_name || !input.change_type) return { error: 'component_name and change_type required' };
          const result = impactAnalyzer.analyzeComponentChange(input.component_name, input.change_type, input.symbol_name || '');
          return { result: formatImpactReport(result) };
        }

        case 'full_scan': {
          const result = impactAnalyzer.fullProjectScan();
          if (result.issues.length === 0) {
            return { result: 'Full project scan: No issues found. All references are valid.' };
          }
          const errors = result.issues.filter(i => i.severity === 'error');
          const warnings = result.issues.filter(i => i.severity === 'warning');
          let text = `Full Project Scan: ${result.summary.errors} errors, ${result.summary.warnings} warnings\n`;
          if (errors.length > 0) {
            text += '\nErrors:\n' + errors.map(e => `  ${e.file}:${e.line}: ${e.message}`).join('\n');
          }
          if (warnings.length > 0) {
            text += '\nWarnings:\n' + warnings.slice(0, 20).map(w => `  ${w.file}:${w.line}: ${w.message}`).join('\n');
            if (warnings.length > 20) text += `\n  ... and ${warnings.length - 20} more warnings`;
          }
          return { result: text };
        }

        default:
          return { error: `Unknown action: ${input.action}` };
      }
    },
  };
}

function formatImpactReport(report) {
  const parts = [];
  parts.push(`Impact: ${report.impact?.toUpperCase() || 'UNKNOWN'}`);

  if (report.hasConflict) {
    parts.push(`CONFLICT: Name already exists in ${report.conflictWith?.file}`);
  }

  if (report.suggestion) {
    parts.push(`Suggestion: ${report.suggestion}`);
  }

  if (report.affectedFiles?.length > 0) {
    parts.push(`Affected files (${report.affectedFiles.length}):`);
    for (const f of report.affectedFiles) {
      parts.push(`  - ${f}`);
    }
  }

  if (report.details?.length > 0) {
    parts.push(`Details:`);
    for (const d of report.details.slice(0, 15)) {
      parts.push(`  ${d.file}:${d.line || ''} – ${d.message}`);
    }
    if (report.details.length > 15) {
      parts.push(`  ... and ${report.details.length - 15} more`);
    }
  }

  if (report.updates?.length > 0) {
    parts.push(`Required updates (${report.updates.length}):`);
    for (const u of report.updates.slice(0, 15)) {
      parts.push(`  ${u.file}:${u.line} – ${u.action}`);
    }
  }

  return parts.join('\n');
}
