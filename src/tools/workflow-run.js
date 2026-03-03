/**
 * WorkflowRun Tool - executes VL workflows (version 3.13)
 * Supports two modes:
 * 1. Remote: calls the VL platform stream API (SSE)
 * 2. Local: simulates workflow execution locally via LLM agent pipeline
 */
import fs from 'fs/promises';
import path from 'path';

export function createWorkflowRunTool(config) {
  return {
    description: `Execute a VL workflow. Modes:
- "remote": Run workflow via VL platform API (POST /ih5/play/stream), returns SSE events
- "local": Run workflow locally using Claude as the LLM backend
- "validate": Validate workflow JSON structure without executing
- "status": Check status of a running workflow`,
    parameters: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['remote', 'local', 'validate', 'status'],
          description: 'Execution mode',
        },
        workflow_path: {
          type: 'string',
          description: 'Path to workflow JSON file',
        },
        params: {
          type: 'object',
          description: 'Runtime parameters (userRequest, targetLang, etc.)',
        },
        run_id: {
          type: 'string',
          description: 'Run ID for status queries',
        },
      },
      required: ['mode'],
    },
    execute: async (input) => {
      switch (input.mode) {
        case 'validate':
          return validateWorkflow(config, input.workflow_path);
        case 'remote':
          return runRemoteWorkflow(config, input.workflow_path, input.params);
        case 'local':
          return runLocalWorkflow(config, input.workflow_path, input.params);
        case 'status':
          return `Run status check not yet implemented for run_id: ${input.run_id}`;
        default:
          return 'Unknown mode. Use: remote, local, validate, status.';
      }
    },
  };
}

async function validateWorkflow(config, workflowPath) {
  const fullPath = path.resolve(config.workDir, workflowPath);
  let content;
  try {
    content = await fs.readFile(fullPath, 'utf-8');
  } catch (err) {
    return `Cannot read workflow file: ${err.message}`;
  }

  let wf;
  try {
    wf = JSON.parse(content);
  } catch {
    return 'Invalid JSON in workflow file.';
  }

  const errors = [];
  const warnings = [];

  // Check version
  if (wf.version !== '3.13') {
    errors.push(`Version must be "3.13", got "${wf.version}"`);
  }

  // Check name
  if (!wf.name) errors.push('Missing workflow name');

  // Check registry
  if (!wf.registry) errors.push('Missing registry');

  // Check steps
  if (!wf.steps || !Array.isArray(wf.steps) || wf.steps.length === 0) {
    errors.push('Missing or empty steps array');
  } else {
    const stepIds = new Set(wf.steps.map(s => s.id));

    // Validate each step
    for (const step of wf.steps) {
      if (!step.id) {
        errors.push('Step missing id');
        continue;
      }

      // Check ID prefix
      const validPrefixes = ['LLM_', 'Service_', 'API_', 'Component_', 'Set_', 'Write_', 'Branch_', 'Loop_', 'Stop_'];
      const hasValidPrefix = validPrefixes.some(p => step.id.startsWith(p));
      if (!hasValidPrefix) {
        errors.push(`Step "${step.id}" has invalid prefix. Must start with: ${validPrefixes.join(', ')}`);
      }

      // Check next references
      if (step.next && step.next !== 'PAUSE' && step.next !== 'RETURN' && !stepIds.has(step.next)) {
        errors.push(`Step "${step.id}" references unknown next: "${step.next}"`);
      }

      // Stop nodes cannot have next or children
      if (step.id.startsWith('Stop_')) {
        if (step.next) errors.push(`Stop node "${step.id}" cannot have "next"`);
        if (step.children) errors.push(`Stop node "${step.id}" cannot have "children"`);
      }

      // Check children references (Loop nodes)
      if (step.children) {
        for (const childId of step.children) {
          if (!stepIds.has(childId)) {
            errors.push(`Step "${step.id}" references unknown child: "${childId}"`);
          }
        }
      }

      // Check Branch cases
      if (step.cases) {
        for (const c of step.cases) {
          if (c.next && !stepIds.has(c.next)) {
            errors.push(`Branch "${step.id}" case references unknown: "${c.next}"`);
          }
        }
      }
    }

    // Check for entry nodes (nodes not referenced by any next/children/cases)
    const referenced = new Set();
    for (const step of wf.steps) {
      if (step.next && step.next !== 'PAUSE' && step.next !== 'RETURN') referenced.add(step.next);
      if (step.children) step.children.forEach(c => referenced.add(c));
      if (step.cases) step.cases.forEach(c => { if (c.next) referenced.add(c.next); });
    }
    const entryNodes = wf.steps.filter(s => !referenced.has(s.id));
    if (entryNodes.length === 0) {
      errors.push('No entry nodes found (all nodes are referenced by others - possible cycle)');
    }

    // Check for Stop nodes
    const stopNodes = wf.steps.filter(s => s.id.startsWith('Stop_'));
    if (stopNodes.length === 0) {
      warnings.push('No Stop_* nodes found (workflow may not terminate)');
    }

    // Check unique IDs
    const idCounts = {};
    for (const s of wf.steps) {
      idCounts[s.id] = (idCounts[s.id] || 0) + 1;
    }
    for (const [id, count] of Object.entries(idCounts)) {
      if (count > 1) errors.push(`Duplicate step ID: "${id}" (${count} times)`);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    return `Workflow "${wf.name}" (v${wf.version}): VALID (${wf.steps?.length || 0} steps)`;
  }

  const report = [`Workflow "${wf.name}" validation:`];
  for (const e of errors) report.push(`  ERROR: ${e}`);
  for (const w of warnings) report.push(`  WARN: ${w}`);
  return report.join('\n');
}

async function runRemoteWorkflow(config, workflowPath, params) {
  const fullPath = path.resolve(config.workDir, workflowPath);
  let wfJson;
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    wfJson = JSON.parse(content);
  } catch (err) {
    return `Cannot load workflow: ${err.message}`;
  }

  const apiUrl = config.workflowApiUrl || 'https://editor.visuallogic.ai/ih5/play/stream';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wfJson,
        runParams: { params: params || {} },
      }),
    });

    if (!response.ok) {
      return `API error: ${response.status} ${response.statusText}`;
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const events = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push(data);
        } catch {
          events.push({ raw: line });
        }
      }
    }

    return JSON.stringify({
      status: 'completed',
      eventCount: events.length,
      events: events.slice(0, 20), // Return first 20 events
      summary: events.length > 20 ? `... and ${events.length - 20} more events` : undefined,
    }, null, 2);
  } catch (err) {
    return `Remote execution error: ${err.message}`;
  }
}

async function runLocalWorkflow(config, workflowPath, params) {
  const fullPath = path.resolve(config.workDir, workflowPath);
  let wfJson;
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    wfJson = JSON.parse(content);
  } catch (err) {
    return `Cannot load workflow: ${err.message}`;
  }

  try {
    const { WorkflowExecutor } = await import('../vl/workflow-executor.js');
    const executor = new WorkflowExecutor({
      apiKey: config.apiKey,
      model: config.model,
      workDir: config.workDir,
    });

    const events = [];
    const filesWritten = [];

    await executor.execute(wfJson, params || {}, {
      onNodeStart: (info) => events.push({ type: 'node_start', ...info }),
      onNodeDone: (info) => events.push({ type: 'node_done', ...info }),
      onNodeError: (info) => events.push({ type: 'node_error', ...info }),
      onFileWritten: (fp) => filesWritten.push(fp),
      onToken: () => {},
      onDone: (info) => events.push({ type: 'done', ...info }),
      onError: (msg) => events.push({ type: 'error', message: msg }),
    });

    const output = [];
    output.push(`Workflow "${wfJson.name}" executed locally — ${events.filter(e => e.type === 'node_done').length} nodes completed`);
    if (filesWritten.length > 0) {
      output.push(`\nFiles written (${filesWritten.length}):`);
      for (const f of filesWritten) output.push(`  ${f}`);
    }
    const errors = events.filter(e => e.type === 'node_error');
    if (errors.length > 0) {
      output.push(`\nErrors (${errors.length}):`);
      for (const e of errors) output.push(`  ${e.nodeId}: ${e.error}`);
    }
    return output.join('\n');
  } catch (err) {
    return `Local execution failed: ${err.message}`;
  }
}
