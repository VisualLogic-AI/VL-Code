/**
 * VLMetadata Tool - extracts structured metadata from VL project files
 * Integrates the vl-metadata-extractor.js concepts
 * Provides: file manifest, dependency graph, component/service catalogs
 */
import fs from 'fs/promises';
import path from 'path';

export function createVLMetadataTool(projectContext) {
  return {
    description: 'Extract structured metadata from VL project files. Returns component catalogs, service inventories, dependency graphs, and project manifests. Actions: "manifest" (file list), "dependencies" (dep graph), "components" (all components), "services" (all services), "summary" (full overview).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['manifest', 'dependencies', 'components', 'services', 'summary'],
          description: 'What metadata to extract',
        },
      },
      required: ['action'],
    },
    execute: async (input) => {
      switch (input.action) {
        case 'manifest':
          return getManifest(projectContext);
        case 'dependencies':
          return getDependencies(projectContext);
        case 'components':
          return getComponents(projectContext);
        case 'services':
          return getServices(projectContext);
        case 'summary':
          return getSummary(projectContext);
        default:
          return 'Unknown action. Use: manifest, dependencies, components, services, summary.';
      }
    },
  };
}

function getManifest(ctx) {
  const manifest = {
    projectName: ctx.projectName,
    vlVersion: ctx.vlVersion,
    files: ctx.getAllFiles().map(f => ({
      path: f.path,
      type: f.type,
      name: f.name,
    })),
  };
  return JSON.stringify(manifest, null, 2);
}

async function getDependencies(ctx) {
  const nodes = [];
  const edges = [];

  for (const file of ctx.getAllFiles()) {
    nodes.push({ id: file.path, type: file.type, label: file.name });

    // Parse file for references
    try {
      const content = await fs.readFile(file.fullPath, 'utf-8');

      // Find Section references in App files
      if (file.type === 'app') {
        const sectionRefs = content.matchAll(/<Section-(\w+)\s+"[^"]+"/g);
        for (const m of sectionRefs) {
          const target = ctx.getFilesByType('section').find(f => f.name === m[1]);
          if (target) edges.push({ from: file.path, to: target.path, type: 'hosts' });
        }
        const compRefs = content.matchAll(/<Component-(\w+)\s+"[^"]+"/g);
        for (const m of compRefs) {
          const target = ctx.getFilesByType('component').find(f => f.name === m[1]);
          if (target) edges.push({ from: file.path, to: target.path, type: 'uses' });
        }
      }

      // Find Service references in Section files
      if (file.type === 'section') {
        const serviceRefs = content.matchAll(/<ServiceDomain-(\w+)>/g);
        for (const m of serviceRefs) {
          const target = ctx.getFilesByType('service').find(f => f.name === m[1]);
          if (target) edges.push({ from: file.path, to: target.path, type: 'calls' });
        }
        const compRefs = content.matchAll(/<Component-(\w+)\s+"[^"]+"/g);
        for (const m of compRefs) {
          const target = ctx.getFilesByType('component').find(f => f.name === m[1]);
          if (target) edges.push({ from: file.path, to: target.path, type: 'uses' });
        }
      }
    } catch {
      continue;
    }
  }

  return JSON.stringify({ nodes, edges }, null, 2);
}

async function getComponents(ctx) {
  const components = [];
  for (const file of ctx.getFilesByType('component')) {
    try {
      const content = await fs.readFile(file.fullPath, 'utf-8');
      const props = [];
      const events = [];

      // Extract public props
      const propMatches = content.matchAll(/\$(\w+)\(([^)]+)\)\s*=\s*(.+)/g);
      for (const m of propMatches) {
        props.push({ name: m[1], type: m[2], default: m[3].trim() });
      }

      // Extract events
      const eventMatches = content.matchAll(/EVENT\s+@(\w+)\(([^)]*)\)/g);
      for (const m of eventMatches) {
        events.push({ name: m[1], params: m[2] });
      }

      components.push({ id: file.name, path: file.path, props, events });
    } catch {
      components.push({ id: file.name, path: file.path, props: [], events: [] });
    }
  }

  return JSON.stringify(components, null, 2);
}

async function getServices(ctx) {
  const services = [];
  for (const file of ctx.getFilesByType('service')) {
    try {
      const content = await fs.readFile(file.fullPath, 'utf-8');
      const methods = [];

      // Extract SERVICE and PUBLIC_SERVICE declarations
      const serviceMatches = content.matchAll(/(PUBLIC_)?SERVICE\s+(\w+)\(([^)]*)\);\s*RETURN\s+(\{[^}]*\}|\w+)/g);
      for (const m of serviceMatches) {
        methods.push({
          name: m[2],
          isPublic: !!m[1],
          params: m[3],
          returns: m[4],
        });
      }

      services.push({ domainId: file.name, path: file.path, methods });
    } catch {
      services.push({ domainId: file.name, path: file.path, methods: [] });
    }
  }

  return JSON.stringify(services, null, 2);
}

async function getSummary(ctx) {
  const summary = ctx.getSummary();
  if (!summary) return 'No VL project detected.';

  const files = ctx.getAllFiles();
  const lines = [
    `Project: ${summary.projectName || 'Unknown'}`,
    `VL Version: ${summary.vlVersion || 'Unknown'}`,
    `Files: ${summary.totalFiles} (${summary.breakdown})`,
    '',
    'File Inventory:',
  ];

  for (const type of ['app', 'section', 'component', 'service', 'database', 'theme']) {
    const typeFiles = files.filter(f => f.type === type);
    if (typeFiles.length > 0) {
      lines.push(`  ${type}: ${typeFiles.map(f => f.name).join(', ')}`);
    }
  }

  return lines.join('\n');
}
