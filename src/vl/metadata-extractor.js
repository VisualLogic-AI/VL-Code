/**
 * Metadata Extractor Bridge — ESM wrapper for vl-metadata-extractor.js (CJS)
 *
 * Searches for the extractor in multiple locations:
 *   1. <workDir>/vl-metadata-extractor.js
 *   2. <workDir>/.vl-code/vl-metadata-extractor.js
 *   3. ../vl-metadata-extractor.js (sibling to project)
 *
 * Provides:
 *   - extractFromFileTree(fileTree) → full ProjectMeta/1.0
 *   - extractSingleFile(filePath, content) → parsed module entry
 *   - mergeIntoMeta(meta, type, entry) → merge single-file result into existing meta
 *   - validateMeta(meta) → consistency checks (§5 of spec)
 *   - buildGraph(meta) → visualization graph
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _extractor = null;
let _loaded = false;

/**
 * Load the VLMetadataExtractor CJS module.
 * Returns the extractor object or null if not found.
 */
export function getExtractor(workDir) {
  if (_loaded) return _extractor;
  _loaded = true;

  const require = createRequire(import.meta.url);
  const searchPaths = [];

  if (workDir) {
    searchPaths.push(
      path.join(workDir, 'vl-metadata-extractor.js'),
      path.join(workDir, '.vl-code', 'vl-metadata-extractor.js'),
      path.resolve(workDir, '..', 'vl-metadata-extractor.js'),
    );
  }

  // Also check relative to this source file
  searchPaths.push(
    path.resolve(__dirname, '..', '..', '..', 'vl-metadata-extractor.js'),
    path.resolve(__dirname, '..', '..', 'vl-metadata-extractor.js'),
  );

  for (const p of searchPaths) {
    try {
      _extractor = require(p);
      return _extractor;
    } catch { continue; }
  }

  return null;
}

/**
 * Extract full ProjectMeta/1.0 from a fileTree map.
 * @param {Object} fileTree - { 'Apps/X.vx': '...content...', ... }
 * @param {string} [workDir] - working directory for extractor search
 * @returns {Object|null} ProjectMeta/1.0 object or null
 */
export function extractFromFileTree(fileTree, workDir) {
  const ext = getExtractor(workDir);
  if (!ext?.extract) return null;
  return ext.extract(fileTree);
}

/**
 * Parse a single VL file into its ProjectMeta entry.
 * @returns {{ type: string, result: Object }|null}
 */
export function extractSingleFile(filePath, content, workDir) {
  const ext = getExtractor(workDir);
  if (!ext?.parsers) return null;

  const fileExt = path.extname(filePath).substring(1).toLowerCase();
  const parserMap = {
    vx: { parser: ext.parsers.parseVX, metaKey: 'apps' },
    sc: { parser: ext.parsers.parseSC, metaKey: 'sections' },
    cp: { parser: ext.parsers.parseCP, metaKey: 'components' },
    vs: { parser: ext.parsers.parseVS, metaKey: 'services' },
    vdb: { parser: ext.parsers.parseVDB, metaKey: 'dataSchema' },
  };

  const entry = parserMap[fileExt];
  if (!entry) return null;

  try {
    const result = entry.parser(content, filePath);
    return { type: fileExt, metaKey: entry.metaKey, result };
  } catch {
    return null;
  }
}

/**
 * Merge a single-file extraction result into existing ProjectMeta.
 * Replaces the matching entry by ID or appends if new.
 */
export function mergeIntoMeta(meta, extracted) {
  if (!meta || !extracted) return meta;

  const { type, metaKey, result } = extracted;

  if (type === 'vdb') {
    // Database replaces the entire dataSchema
    meta.dataSchema = { tables: result.tables, relations: result.relations };
    if (result.projectName) meta.projectName = result.projectName;
    return meta;
  }

  // For array-based entries (apps, sections, components, services)
  const arr = meta[metaKey];
  if (!Array.isArray(arr)) return meta;

  const idField = type === 'vs' ? 'domainId' : 'id';
  const id = result[idField];
  const idx = arr.findIndex(item => item[idField] === id);

  if (idx >= 0) {
    arr[idx] = result; // Replace existing
  } else {
    arr.push(result); // Append new
  }

  return meta;
}

/**
 * Validate ProjectMeta consistency (§5 of spec).
 * Returns { valid: boolean, issues: string[] }
 */
export function validateMeta(meta) {
  const issues = [];
  if (!meta) return { valid: false, issues: ['No ProjectMeta provided'] };

  // §5.1 ID Chain Integrity
  const tableIds = new Set((meta.dataSchema?.tables || []).map(t => t.id));
  const serviceIds = new Set();
  const sectionIds = new Set((meta.sections || []).map(s => s.id));
  const componentIds = new Set((meta.components || []).map(c => c.id));

  for (const svc of (meta.services || [])) {
    for (const m of (svc.methods || [])) {
      serviceIds.add(`${svc.domainId}.${m.id}`);
    }
    for (const vt of (svc.virtualTables || [])) {
      if (!tableIds.has(vt.source)) {
        issues.push(`Service ${svc.domainId}: VirtualTable "${vt.id}" references unknown table "${vt.source}"`);
      }
    }
  }

  for (const sec of (meta.sections || [])) {
    for (const consumed of (sec.consumesServices || [])) {
      if (!serviceIds.has(consumed)) {
        issues.push(`Section ${sec.id}: consumesServices references unknown service "${consumed}"`);
      }
    }
    for (const comp of (sec.usesComponents || [])) {
      if (!componentIds.has(comp)) {
        issues.push(`Section ${sec.id}: usesComponents references unknown component "${comp}"`);
      }
    }
  }

  // §5.3 Wiring Integrity — check app layout refs
  for (const app of (meta.apps || [])) {
    const layoutRefs = new Set();
    const collectRefs = (nodes) => {
      for (const n of (nodes || [])) {
        if (n.as) layoutRefs.add(n.as);
        if (n.children) collectRefs(n.children);
      }
    };
    for (const page of (app.pages || [])) {
      collectRefs(page.layout);
    }
    for (const w of (app.wiring || [])) {
      const instanceId = w.on?.split('.')[0];
      if (instanceId && !layoutRefs.has(instanceId)) {
        issues.push(`App ${app.id}: wiring references unknown instance "${instanceId}"`);
      }
    }
  }

  // §5.4 Enum References
  const enumNames = new Set((meta.valueDomains?.enums || []).map(e => e.name));
  for (const table of (meta.dataSchema?.tables || [])) {
    for (const field of (table.fields || [])) {
      if (field.enumRef && !enumNames.has(field.enumRef)) {
        issues.push(`Table ${table.id}: field "${field.name}" references unknown enum "${field.enumRef}"`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Build visualization graph from ProjectMeta.
 */
export function buildMetaGraph(meta, workDir) {
  const ext = getExtractor(workDir);
  if (!ext?.buildGraph) return null;
  return ext.buildGraph(meta);
}
