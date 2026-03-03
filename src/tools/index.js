/**
 * Tool Registration - registers all tools with the ToolRegistry
 *
 * Tool categories:
 *   Core (mirrors Claude Code): Read, Edit, Write, Bash, Grep, Glob, TodoWrite, SubAgent
 *   VL Intelligence (surpasses Claude Code): VLSymbols, VLImpact, VLEditSection, VLAutoFix
 *   VL Standard: VLValidate, VLMetadata
 *   Workflow: WorkflowRun, WorkspaceAPI
 */
import { createReadFileTool } from './read-file.js';
import { createEditFileTool } from './edit-file.js';
import { createWriteFileTool } from './write-file.js';
import { createBashTool } from './bash.js';
import { createGrepTool } from './grep.js';
import { createGlobTool } from './glob.js';
import { createTodoWriteTool } from './todo-write.js';
import { createSubAgentTool } from './sub-agent.js';
import { createVLValidateTool } from './vl-validate.js';
import { createVLMetadataTool } from './vl-metadata.js';
import { createVLSymbolsTool } from './vl-symbols.js';
import { createVLImpactTool } from './vl-impact.js';
import { createVLEditSectionTool } from './vl-edit-section.js';
import { createVLAutoFixTool } from './vl-autofix.js';
import { createWorkflowRunTool } from './workflow-run.js';
import { createWorkspaceAPITool } from './workspace-api.js';
import { createVLParseTool } from './vl-parse.js';
import { createAskUserTool } from './ask-user.js';
import { createMemoryTool } from './memory.js';
import { createToolSearchTool } from './tool-search.js';
import { createDocCenterTool } from './doc-center.js';
import { createBrowserInspectTool } from './browser-inspect.js';
import { createVLComponentTestTool } from './vl-component-test.js';
import { createVLSyntaxRefTool } from './vl-syntax-ref.js';
import { createVLCompileTool } from './vl-compile.js';

export function registerAllTools(registry, config, projectContext) {
  // Core file tools (mirrors Claude Code)
  registry.register('ReadFile', createReadFileTool(config));
  registry.register('EditFile', createEditFileTool(config));
  registry.register('WriteFile', createWriteFileTool(config));

  // System tools
  registry.register('Bash', createBashTool(config));
  registry.register('Grep', createGrepTool(config));
  registry.register('Glob', createGlobTool(config));

  // State management
  registry.register('TodoWrite', createTodoWriteTool());

  // Sub-agent (mirrors Claude Code's Task tool)
  registry.register('SubAgent', createSubAgentTool());

  // VL-specific tools (standard)
  registry.register('VLValidate', createVLValidateTool(projectContext));
  registry.register('VLMetadata', createVLMetadataTool(projectContext));

  // Workflow & Deploy tools
  registry.register('WorkflowRun', createWorkflowRunTool(config));
  registry.register('WorkspaceAPI', createWorkspaceAPITool(config));
  registry.register('VLParse', createVLParseTool(config));

  // Interactive tools
  registry.register('AskUserQuestion', createAskUserTool());
  registry.register('Memory', createMemoryTool(config));

  // Cloud document management (DocCenter API)
  registry.register('DocCenter', createDocCenterTool(config));

  // Browser automation (Playwright-powered self-testing)
  registry.register('BrowserInspect', createBrowserInspectTool(config));

  // VL Component testing (Playwright + instance-id targeting)
  registry.register('VLComponentTest', createVLComponentTestTool(config));

  // VL Syntax Reference (on-demand VL Bible lookup)
  registry.register('VLSyntaxRef', createVLSyntaxRefTool(config));

  // VL Compile (direct compile via parsevl API)
  registry.register('VLCompile', createVLCompileTool(config));

  // Tool Search / Deferred Loading (discovers and activates deferred tools)
  registry.register('ToolSearch', createToolSearchTool(registry));

  // --- VL Intelligence tools (registered later when modules are ready) ---
  // These are registered by registerIntelligenceTools() after index.js
  // initializes SymbolIndex, ImpactAnalyzer, AutoFix
}

/**
 * Register VL intelligence tools (requires initialized modules)
 * Called from index.js after SymbolIndex, ImpactAnalyzer, AutoFix are ready
 */
export function registerIntelligenceTools(registry, config, { symbolIndex, impactAnalyzer, autoFix }) {
  // VL Language Intelligence (surpasses Claude Code)
  registry.register('VLSymbols', createVLSymbolsTool(symbolIndex));
  registry.register('VLImpact', createVLImpactTool(impactAnalyzer));
  registry.register('VLEditSection', createVLEditSectionTool(config));
  registry.register('VLAutoFix', createVLAutoFixTool(autoFix));
}
