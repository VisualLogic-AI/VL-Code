/**
 * VL Project Context - detects and loads VL project information at zero API cost
 * Mirrors Claude Code's local pre-collection: git status, CLAUDE.md, etc.
 * This module scans the working directory for VL files and builds a project model
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { extractFromFileTree, validateMeta } from './metadata-extractor.js';

const VL_EXTENSIONS = {
  '.vx': 'app',
  '.sc': 'section',
  '.cp': 'component',
  '.vs': 'service',
  '.vdb': 'database',
  '.vth': 'theme',
};

const VL_DIRECTORIES = {
  'Apps': 'app',
  'Sections': 'section',
  'ExtComponents': 'component',
  'Services': 'service',
  'Database': 'database',
  'Theme': 'theme',
  'Process': 'process',
};

export class VLProjectContext {
  constructor(workDir) {
    this.workDir = workDir;
    this.files = [];       // [{path, type, ext, name}]
    this.fileTree = {};    // {category: [filename]}
    this.vlVersion = null;
    this.projectName = null;
    this._isVLProject = false;
    this.vlConfig = null;  // VLCONFIG.md content (like CLAUDE.md)
    this.projectMeta = null;  // ProjectMeta/1.0 object
    this.projectMd = null;    // PROJECT.md content
    this.rules = [];          // .vl-code/rules/*.md contents
  }

  async load() {
    try {
      // 1. Scan for VL files
      await this.scanDirectory(this.workDir, '');

      // 2. Determine if this is a VL project (must have actual VL source files)
      this._isVLProject = this.files.some(f => f.isVL);

      // 3. Extract version from first VL file found
      if (this._isVLProject) {
        await this.detectVersion();
        await this.detectProjectName();
      }

      // 4. Load VLCONFIG.md if exists (equivalent to CLAUDE.md)
      await this.loadVLConfig();

      // 5. Load PROJECT.md (search .vl-code/PROJECT.md → VLCONFIG.md compat)
      await this.loadProjectMd();

      // 6. Load .vl-code/rules/*.md
      await this.loadRules();

      // 7. Load or extract ProjectMeta/1.0
      await this.loadProjectMeta();

      // 8. Include .vl-code/ProjectMeta.json if it exists (core file, not scanned because . prefix)
      await this.includeVLCodeFiles();

      // 9. Build file tree
      this.buildFileTree();
    } catch {
      // Not a VL project or scan error - that's fine
    }
  }

  async scanDirectory(dir, relativePath) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    // Allowed project directories (skip random folders)
    const projectDirs = new Set(Object.keys(VL_DIRECTORIES));

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // At root level, only recurse into known VL project directories
        if (!relativePath && !projectDirs.has(entry.name)) continue;
        await this.scanDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (VL_EXTENSIONS[ext]) {
          // VL source file
          this.files.push({
            path: relPath,
            fullPath,
            type: VL_EXTENSIONS[ext],
            ext,
            name: path.basename(entry.name, ext),
            isVL: true,
          });
        } else if (['.json', '.md', '.txt'].includes(ext)) {
          // Auxiliary file (Process/, Database/, etc.) — appears in tree, not compiled
          this.files.push({
            path: relPath,
            fullPath,
            type: VL_DIRECTORIES[relativePath?.split('/')[0]] || 'process',
            ext,
            name: path.basename(entry.name, ext),
            isVL: false,
          });
        }
      }
    }
  }

  async detectVersion() {
    for (const file of this.files) {
      try {
        const content = await fs.readFile(file.fullPath, 'utf-8');
        const match = content.match(/\/\/\s*VL_VERSION:(\S+)/);
        if (match) {
          this.vlVersion = match[1];
          return;
        }
      } catch {
        continue;
      }
    }
  }

  async detectProjectName() {
    // Project name from database file or first app file
    const dbFile = this.files.find(f => f.type === 'database');
    if (dbFile) {
      this.projectName = dbFile.name;
      return;
    }
    const appFile = this.files.find(f => f.type === 'app');
    if (appFile) {
      this.projectName = appFile.name.replace(/App$/, '');
    }
  }

  async loadVLConfig() {
    const candidates = ['VLCONFIG.md', 'VL.md', '.vl/config.md'];
    for (const name of candidates) {
      try {
        const content = await fs.readFile(path.join(this.workDir, name), 'utf-8');
        this.vlConfig = content;
        return;
      } catch {
        continue;
      }
    }
  }

  /**
   * Include key files from .vl-code/ that should be visible in the file tree.
   * The .vl-code directory is normally skipped (starts with .) but ProjectMeta.json
   * and project.json are core files users need to see.
   */
  async includeVLCodeFiles() {
    const vlCodeDir = path.join(this.workDir, '.vl-code');
    const coreFiles = ['ProjectMeta.json', 'project.json', 'conventions.json'];
    for (const name of coreFiles) {
      const fullPath = path.join(vlCodeDir, name);
      try {
        await fs.access(fullPath);
        // Only add if not already in files list
        const relPath = `.vl-code/${name}`;
        if (!this.files.find(f => f.path === relPath)) {
          this.files.push({
            path: relPath,
            fullPath,
            type: 'process',
            ext: path.extname(name),
            name: path.basename(name, path.extname(name)),
            isVL: false,
          });
        }
      } catch { /* file doesn't exist */ }
    }
  }

  buildFileTree() {
    this.fileTree = {};
    // Dedup files by path first (safety net against any double-load scenarios)
    const seen = new Set();
    const deduped = [];
    for (const file of this.files) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      deduped.push(file);
    }
    this.files = deduped;

    for (const file of this.files) {
      const dir = path.dirname(file.path);
      const category = (!dir || dir === '.') ? 'root' : dir;
      if (!this.fileTree[category]) this.fileTree[category] = [];
      this.fileTree[category].push(path.basename(file.path));
    }
  }

  /**
   * Re-scan the project directory. Resets all file state and reloads.
   * Called after file mutations (delete, clear, upload, etc.)
   * Uses a lock to prevent concurrent scans from corrupting state.
   * Returns true if scan completed, false if queued for later.
   */
  async scan() {
    // If already scanning, queue for when current scan finishes
    if (this._scanning) {
      // Return a promise that resolves when the queued scan actually completes
      return new Promise((resolve) => {
        this._scanQueue = this._scanQueue || [];
        this._scanQueue.push(resolve);
      });
    }
    this._scanning = true;
    try {
      this.files = [];
      this.fileTree = {};
      this.projectMeta = null;
      this._isVLProject = false;
      await this.load();
    } finally {
      this._scanning = false;
      // If scans were requested while we were busy, run one more and resolve all waiters
      if (this._scanQueue && this._scanQueue.length > 0) {
        const waiters = this._scanQueue;
        this._scanQueue = [];
        await this.scan();
        for (const resolve of waiters) resolve();
      }
    }
  }

  /**
   * Get only VL source files (for compilation/validation)
   */
  getVLFiles() {
    return this.files.filter(f => f.isVL);
  }

  /**
   * Load ProjectMeta/1.0 from .vl-code/ProjectMeta.json.
   * If not found, auto-extract from VL source files using vl-metadata-extractor.
   */
  async loadProjectMeta() {
    // Try loading existing ProjectMeta.json (always attempt — may exist before VL files)
    const metaPath = path.join(this.workDir, '.vl-code', 'ProjectMeta.json');
    try {
      const content = await fs.readFile(metaPath, 'utf-8');
      this.projectMeta = JSON.parse(content);
      return;
    } catch { /* not found, will auto-extract if VL project */ }

    if (!this._isVLProject) return;

    // Auto-extract from VL source files
    const fileTree = await this.buildVLFileTree();
    if (Object.keys(fileTree).length === 0) return;

    const meta = extractFromFileTree(fileTree, this.workDir);
    if (meta) {
      this.projectMeta = meta;
      // Save extracted meta to .vl-code/ for persistence
      try {
        const vlCodeDir = path.join(this.workDir, '.vl-code');
        if (!fsSync.existsSync(vlCodeDir)) {
          await fs.mkdir(vlCodeDir, { recursive: true });
        }
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      } catch { /* save failed, non-critical */ }
    }
  }

  /**
   * Build a fileTree map { relativePath: content } from all VL files.
   * Used as input for vl-metadata-extractor.
   */
  async buildVLFileTree() {
    const fileTree = {};
    for (const file of this.files) {
      try {
        const content = await fs.readFile(file.fullPath, 'utf-8');
        fileTree[file.path] = content;
      } catch { continue; }
    }
    return fileTree;
  }

  /**
   * Load PROJECT.md — search paths:
   *   1. .vl-code/PROJECT.md (new standard)
   *   2. VLCONFIG.md (backward compat, already loaded as vlConfig)
   */
  async loadProjectMd() {
    const candidates = [
      path.join(this.workDir, '.vl-code', 'PROJECT.md'),
      path.join(this.workDir, 'PROJECT.md'),
    ];
    for (const filePath of candidates) {
      try {
        this.projectMd = await fs.readFile(filePath, 'utf-8');
        return;
      } catch { continue; }
    }
    // Fallback: use VLCONFIG.md if already loaded
    if (this.vlConfig) {
      this.projectMd = this.vlConfig;
    }
  }

  /**
   * Load all rule files from .vl-code/rules/*.md
   */
  async loadRules() {
    const rulesDir = path.join(this.workDir, '.vl-code', 'rules');
    try {
      const entries = await fs.readdir(rulesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const content = await fs.readFile(path.join(rulesDir, entry.name), 'utf-8');
            this.rules.push({ name: entry.name.replace('.md', ''), content });
          } catch { continue; }
        }
      }
    } catch { /* rules dir not found */ }
  }

  isVLProject() {
    return this._isVLProject;
  }

  getSummary() {
    if (!this._isVLProject) return null;

    const counts = {};
    for (const f of this.files) {
      counts[f.type] = (counts[f.type] || 0) + 1;
    }
    const breakdown = Object.entries(counts)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');

    return {
      projectName: this.projectName,
      vlVersion: this.vlVersion,
      totalFiles: this.files.length,
      breakdown,
      counts,
    };
  }

  getVLConfig() {
    return this.vlConfig;
  }

  getFileTree() {
    return this.fileTree;
  }

  getFilesByType(type) {
    return this.files.filter(f => f.type === type);
  }

  getFile(relativePath) {
    return this.files.find(f => f.path === relativePath);
  }

  getAllFiles() {
    return this.files;
  }

  getProjectMeta() {
    return this.projectMeta;
  }

  getProjectMd() {
    return this.projectMd;
  }

  getRules() {
    return this.rules;
  }
}
