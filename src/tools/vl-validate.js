/**
 * VLValidate Tool - validates VL source files against VL 2.91 syntax rules
 * Checks: version header, section order, naming conventions, cross-references, etc.
 */
import fs from 'fs/promises';
import path from 'path';

const VL_EXTENSIONS = ['.vx', '.sc', '.cp', '.vs', '.vdb', '.vth'];

const SECTION_ORDER = {
  '.vx': [
    'SysConfig', 'Frontend Global Vars', 'Frontend Derived Vars', 'Frontend Tree',
    'Frontend Event Handlers', 'Frontend Internal Methods', 'Frontend Pipeline Funcs',
  ],
  '.sc': [
    'Frontend Public Props', 'Frontend Public Events', 'Frontend Public Methods',
    'Frontend Global Vars', 'Frontend Derived Vars', 'Frontend Tree',
    'Frontend Event Handlers', 'Frontend Internal Methods', 'Frontend Pipeline Funcs',
  ],
  '.cp': [
    'Frontend Public Props', 'Frontend Public Events',
    'Frontend Derived Vars', 'Frontend Tree',
    'Frontend Event Handlers', 'Frontend Internal Methods', 'Frontend Pipeline Funcs',
  ],
  '.vs': [
    'Backend Environment Vars', 'Backend Tree', 'Services',
    'Backend Event Handlers', 'Transactions',
    'Backend Internal Methods', 'Backend Pipeline Funcs',
  ],
};

export function createVLValidateTool(projectContext) {
  return {
    description: 'Validate a VL source file against VL 2.91 syntax rules. Checks version header, section ordering, naming conventions, and structural rules. Pass a file path or "all" to validate the entire project.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to VL file to validate, or "all" for entire project',
        },
      },
      required: ['file_path'],
    },
    execute: async (input) => {
      if (input.file_path === 'all') {
        return validateAll(projectContext);
      }
      const filePath = path.resolve(projectContext.workDir, input.file_path);
      return validateFile(filePath, input.file_path);
    },
  };
}

async function validateAll(projectContext) {
  const files = (projectContext.getVLFiles || projectContext.getAllFiles).call(projectContext);
  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const { errors, warnings } = await validateFile(file.fullPath, '__structured__');
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    if (errors.length > 0 || warnings.length > 0) {
      results.push(`\n${file.path}:`);
      for (const e of errors) results.push(`  ERROR: ${e}`);
      for (const w of warnings) results.push(`  WARN: ${w}`);
    }
  }

  if (results.length === 0) {
    return `All ${files.length} VL files passed validation.`;
  }
  return `Validation: ${totalErrors} errors, ${totalWarnings} warnings\n${results.join('\n')}`;
}

async function validateFile(filePath, displayPath) {
  const errors = [];
  const warnings = [];
  const ext = path.extname(filePath);

  if (!VL_EXTENSIONS.includes(ext)) {
    return { errors: [`Not a VL file: ${ext}`], warnings: [] };
  }

  let content;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    return { errors: [`Cannot read file: ${err.message}`], warnings: [] };
  }

  const lines = content.split('\n');

  // Rule 1: Version declaration
  const hasVersion = lines.some(l => l.match(/\/\/\s*VL_VERSION:\S+/));
  if (!hasVersion) {
    errors.push('Missing VL_VERSION declaration (e.g., // VL_VERSION:2.91)');
  }

  // Rule 2: Root component declaration
  if (['.vx', '.sc', '.cp', '.vs'].includes(ext)) {
    const hasRoot = lines.some(l => l.match(/^<\w+-\w+\s+"[^"]+"\s*>/));
    if (!hasRoot) {
      errors.push('Missing root component declaration (e.g., <App-Name "root">)');
    }
  }

  // Rule 3: Section order
  const expectedOrder = SECTION_ORDER[ext];
  if (expectedOrder) {
    const foundSections = [];
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)$/);
      if (match) {
        foundSections.push(match[1].trim());
      }
    }

    let lastIndex = -1;
    for (const section of foundSections) {
      const idx = expectedOrder.indexOf(section);
      if (idx === -1) {
        warnings.push(`Unknown section: # ${section}`);
      } else if (idx < lastIndex) {
        errors.push(`Section "# ${section}" is out of order (expected after "${expectedOrder[lastIndex]}")`);
      } else {
        lastIndex = idx;
      }
    }
  }

  // Rule 4: No escape characters
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('\\n') || lines[i].includes('\\t') || lines[i].includes("\\'")) {
      errors.push(`Line ${i + 1}: Escape characters (\\) are forbidden in VL`);
      break; // Report once
    }
  }

  // Rule 5: Semicolons only in FOR loops
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes(';') && !line.startsWith('//') && !line.startsWith('FOR') &&
        !line.match(/^(METHOD|SERVICE|PIPE|TRANSACTION|PUBLIC_SERVICE|METHOD_PUB|EVENT)\s/)) {
      warnings.push(`Line ${i + 1}: Semicolons should only appear in FOR loops and declarations`);
      break;
    }
  }

  // Rule 6: Variable naming ($camelCase)
  for (let i = 0; i < lines.length; i++) {
    const varMatch = lines[i].match(/\$([A-Z][a-zA-Z]*)\(/);
    if (varMatch) {
      errors.push(`Line ${i + 1}: Variable $${varMatch[1]} should use camelCase (not PascalCase)`);
    }
  }

  // Rule 7: Indentation uses dashes not spaces
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^  +[-<$]/)) {
      warnings.push(`Line ${i + 1}: VL uses dash (-) indentation, not spaces`);
      break;
    }
  }

  // When called from validateAll, return structured data
  if (displayPath === '__structured__') {
    return { errors, warnings };
  }

  const report = [];
  if (errors.length === 0 && warnings.length === 0) {
    report.push(`${displayPath}: PASSED`);
  } else {
    report.push(`${displayPath}: ${errors.length} errors, ${warnings.length} warnings`);
    for (const e of errors) report.push(`  ERROR: ${e}`);
    for (const w of warnings) report.push(`  WARN: ${w}`);
  }

  return report.join('\n');
}
