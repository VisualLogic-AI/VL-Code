/**
 * VLSyntaxRef – On-demand VL syntax reference lookup tool
 *
 * Provides AI access to the complete VL language specification (the "VL Bible").
 * Actions:
 *   search  – keyword search across the entire reference
 *   section – return a named section by id
 *   widget  – return documentation for a specific widget/component
 *   rules   – return the VL Generation Hard Rules
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

/** Load the VL Bible text (cached in memory after first read) */
let _bibleCache = null;
let _metaCache = null;

function loadBible() {
  if (_bibleCache) return _bibleCache;
  // Try project-local override first, then global, then bundled
  const candidates = [
    path.join(process.cwd(), '.vl-code', 'vl-syntax.md'),
    path.join(os.homedir(), '.vl-code', 'vl-syntax.md'),
    path.join(DATA_DIR, 'vl-syntax.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      _bibleCache = fs.readFileSync(p, 'utf-8');
      return _bibleCache;
    }
  }
  return null;
}

function loadMeta() {
  if (_metaCache) return _metaCache;
  const metaPath = path.join(DATA_DIR, 'vl-syntax-meta.json');
  if (fs.existsSync(metaPath)) {
    _metaCache = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
  return _metaCache;
}

/** Clear cached Bible (called when updating the file) */
export function clearBibleCache() {
  _bibleCache = null;
  _metaCache = null;
}

/** Get the full Bible text (used by prompt-assembler) */
export function getVLBible() {
  return loadBible();
}

function searchBible(bible, query) {
  if (!query) return { error: 'query is required for search action' };
  const lines = bible.split('\n');
  const matches = [];
  const re = new RegExp(query, 'gi');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length - 1, i + 5);
      const context = lines.slice(start, end + 1).map((l, idx) => `${start + idx + 1}: ${l}`).join('\n');
      matches.push({ line: i + 1, match: lines[i].trim(), context });
      if (matches.length >= 20) break; // cap results
    }
  }
  return {
    query,
    totalMatches: matches.length,
    results: matches,
    note: matches.length >= 20 ? 'Results capped at 20. Narrow your search for more specific results.' : undefined,
  };
}

function getSection(bible, sectionId) {
  const meta = loadMeta();
  if (!meta) return { error: 'VL syntax metadata not found' };
  if (!sectionId) {
    return {
      availableSections: meta.sections.map(s => ({ id: s.id, title: s.title })),
      usage: 'Provide a section id, e.g. action:"section", query:"components"',
    };
  }
  const section = meta.sections.find(s =>
    s.id === sectionId || s.title.toLowerCase().includes(sectionId.toLowerCase())
  );
  if (!section) {
    return {
      error: `Section "${sectionId}" not found`,
      availableSections: meta.sections.map(s => ({ id: s.id, title: s.title })),
    };
  }
  const lines = bible.split('\n');
  const content = lines.slice(section.startLine - 1, section.endLine).join('\n');
  return {
    section: section.id,
    title: section.title,
    lineRange: `${section.startLine}-${section.endLine}`,
    content,
  };
}

function getWidgetDoc(bible, widgetName) {
  if (!widgetName) return { error: 'query (widget name) is required, e.g. "Button", "Input", "For", "VirtualTable"' };

  const lines = bible.split('\n');
  // Find the widget heading: #### WidgetName or #### <WidgetName> or #### WidgetName (...)
  const namePattern = widgetName.replace(/[<>]/g, '');
  const headingRe = new RegExp(`^#{2,4}\\s+(?:<)?${namePattern}(?:>)?(?:\\s|\\(|$)`, 'i');

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // Try broader search
    const broadRe = new RegExp(namePattern, 'i');
    const candidates = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^#{2,4}\s+/.test(lines[i]) && broadRe.test(lines[i])) {
        candidates.push({ line: i + 1, heading: lines[i].trim() });
      }
    }
    if (candidates.length > 0) {
      return { error: `Exact widget "${widgetName}" not found. Did you mean one of these?`, candidates };
    }
    return { error: `Widget "${widgetName}" not found in VL reference` };
  }

  // Find end: next heading of same or higher level
  const level = lines[startIdx].match(/^(#{2,4})/)[1].length;
  let endIdx = startIdx + 1;
  while (endIdx < lines.length) {
    const m = lines[endIdx].match(/^(#{2,4})\s/);
    if (m && m[1].length <= level) break;
    endIdx++;
  }

  const content = lines.slice(startIdx, endIdx).join('\n');
  return {
    widget: widgetName,
    lineRange: `${startIdx + 1}-${endIdx}`,
    content,
  };
}

function getHardRules(bible) {
  const lines = bible.split('\n');
  // Find "## VL Generation Hard Rules"
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+VL Generation Hard Rules/i.test(lines[i])) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) {
    // Fallback: use metadata
    const meta = loadMeta();
    if (meta) {
      const section = meta.sections.find(s => s.id === 'hard-rules');
      if (section) {
        return {
          title: 'VL Generation Hard Rules',
          content: lines.slice(section.startLine - 1, section.endLine).join('\n'),
        };
      }
    }
    return { error: 'Hard rules section not found in VL reference' };
  }

  // Find end: next ## heading
  let endIdx = startIdx + 1;
  while (endIdx < lines.length) {
    if (/^##\s/.test(lines[endIdx]) && !/^###/.test(lines[endIdx])) break;
    endIdx++;
  }

  return {
    title: 'VL Generation Hard Rules',
    lineRange: `${startIdx + 1}-${endIdx}`,
    content: lines.slice(startIdx, endIdx).join('\n'),
  };
}

export function createVLSyntaxRefTool(config) {
  return {
    name: 'VLSyntaxRef',
    description: `Look up VL syntax rules, widget documentation, and language reference from the complete VL specification.

Actions:
- search: Search the VL reference for a keyword or pattern. Returns matching lines with context.
- section: Return a named section (overview, syntax, naming, components, variables, logic, expressions, styles, database-rules, auth, hard-rules, widgets-frontend, widgets-backend, etc.)
- widget: Return documentation for a specific widget (Button, Input, Text, For, If, Image, StateStyle, VirtualTable, Auth, etc.)
- rules: Return the VL Generation Hard Rules (critical MUST/MUST NOT constraints)`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['search', 'section', 'widget', 'rules'],
          description: 'What to look up',
        },
        query: {
          type: 'string',
          description: 'Search term, section id, or widget name (not needed for "rules" action)',
        },
      },
      required: ['action'],
    },
    execute: async (input) => {
      const bible = loadBible();
      if (!bible) {
        return { error: 'VL syntax reference not found. Ensure vl-syntax.md is installed at ~/.vl-code/vl-syntax.md or bundled in src/data/' };
      }
      switch (input.action) {
        case 'search':
          return searchBible(bible, input.query);
        case 'section':
          return getSection(bible, input.query);
        case 'widget':
          return getWidgetDoc(bible, input.query);
        case 'rules':
          return getHardRules(bible);
        default:
          return { error: `Unknown action: ${input.action}. Use: search, section, widget, or rules` };
      }
    },
  };
}
