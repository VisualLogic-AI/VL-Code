/**
 * VL-Code SDK — public API for VL IDE integration
 *
 * Usage:
 *   import { createAgent, VLSymbolIndex, SmartContextLoader } from '@vl/code-sdk';
 *
 *   // Create an agent instance
 *   const agent = createAgent({ apiKey, model, workDir, tools: [...] });
 *   const result = await agent.query('优化这个 Section 的性能');
 *
 *   // Stream responses
 *   for await (const event of agent.stream('帮我重构这个 Service')) {
 *     console.log(event.type, event.data);
 *   }
 *
 *   // Use VL Intelligence directly
 *   const index = new VLSymbolIndex(projectContext);
 *   await index.build();
 *   const refs = index.findReferences('$activeRoute');
 */

// --- Core Agent ---
export { AgentOrchestrator } from '../core/orchestrator.js';
export { ToolRegistry } from '../core/tool-registry.js';
export { ContextManager } from '../core/context-manager.js';
export { PromptAssembler } from '../core/prompt-assembler.js';
export { SessionManager } from '../core/session.js';

// --- VL Intelligence ---
export { VLSymbolIndex } from '../vl/symbol-index.js';
export { SmartContextLoader } from '../vl/smart-context.js';
export { BlueprintContext } from '../vl/blueprint-context.js';
export { ImpactAnalyzer } from '../vl/impact-analyzer.js';
export { VLAutoFix } from '../vl/auto-fix.js';
export { VLProjectContext } from '../vl/project-context.js';
export { FileCache } from '../vl/file-cache.js';
export { FileWatcher } from '../vl/file-watcher.js';
export { GenerationPipeline } from '../vl/generation-pipeline.js';

// --- Metadata ---
export { extractFromFileTree, extractSingleFile, mergeIntoMeta, validateMeta, buildMetaGraph } from '../vl/metadata-extractor.js';

// --- Tools (for custom tool sets) ---
export { registerAllTools, registerIntelligenceTools } from '../tools/index.js';

// --- Config ---
export { loadConfig } from '../utils/config.js';

/**
 * Create a pre-configured VL-Code agent instance.
 *
 * @param {Object} options
 * @param {string} options.apiKey - Anthropic API key
 * @param {string} [options.model='claude-sonnet-4-6'] - Claude model ID
 * @param {string} [options.workDir=process.cwd()] - Working directory
 * @param {number} [options.maxTokens=16384] - Max output tokens
 * @param {boolean} [options.enableThinking=true] - Enable extended thinking
 * @param {string[]} [options.tools] - Custom tool whitelist (null = all tools)
 * @returns {{ query, stream, getContext, destroy }}
 */
export async function createAgent(options = {}) {
  const {
    apiKey = process.env.ANTHROPIC_API_KEY,
    model = 'claude-sonnet-4-6',
    workDir = process.cwd(),
    maxTokens = 16384,
    enableThinking = true,
    tools = null,
  } = options;

  if (!apiKey) throw new Error('API key required. Set ANTHROPIC_API_KEY or pass apiKey option.');

  const config = {
    apiKey,
    model,
    workDir,
    maxOutputTokens: maxTokens,
    thinkingBudget: enableThinking ? 10000 : 0,
  };

  // Initialize project context
  const { VLProjectContext } = await import('../vl/project-context.js');
  const projectContext = new VLProjectContext(workDir);
  await projectContext.load();

  // Initialize tool registry
  const { ToolRegistry } = await import('../core/tool-registry.js');
  const { registerAllTools } = await import('../tools/index.js');
  const toolRegistry = new ToolRegistry();
  registerAllTools(toolRegistry, config, projectContext);

  // Initialize context + prompt
  const { ContextManager } = await import('../core/context-manager.js');
  const { PromptAssembler } = await import('../core/prompt-assembler.js');
  const contextManager = new ContextManager(config);
  const promptAssembler = new PromptAssembler(config, projectContext);

  // Initialize orchestrator
  const { AgentOrchestrator } = await import('../core/orchestrator.js');
  const orchestrator = new AgentOrchestrator({
    config,
    toolRegistry,
    contextManager,
    promptAssembler,
    cli: null,
    projectContext,
  });

  // Optional: build VL intelligence if VL project
  let symbolIndex = null;
  let impactAnalyzer = null;
  let autoFix = null;
  if (projectContext.isVLProject()) {
    const { VLSymbolIndex } = await import('../vl/symbol-index.js');
    const { SmartContextLoader } = await import('../vl/smart-context.js');
    const { BlueprintContext } = await import('../vl/blueprint-context.js');
    const { ImpactAnalyzer } = await import('../vl/impact-analyzer.js');
    const { VLAutoFix } = await import('../vl/auto-fix.js');
    const { registerIntelligenceTools } = await import('../tools/index.js');

    symbolIndex = new VLSymbolIndex(projectContext);
    await symbolIndex.build();
    orchestrator.symbolIndex = symbolIndex;

    const smartContext = new SmartContextLoader(projectContext);
    await smartContext.buildGraph();
    orchestrator.smartContext = smartContext;

    const blueprintContext = new BlueprintContext(projectContext);
    await blueprintContext.load();
    orchestrator.blueprintContext = blueprintContext;

    impactAnalyzer = new ImpactAnalyzer(symbolIndex, projectContext);
    autoFix = new VLAutoFix(projectContext);

    registerIntelligenceTools(toolRegistry, config, { symbolIndex, impactAnalyzer, autoFix });
  }

  return {
    /**
     * Send a single query and get the full response.
     * @param {string} message - User message
     * @param {Object} [opts] - Options: { images, mentions, selection }
     * @returns {Promise<{ text: string, toolCalls: Array, usage: Object }>}
     */
    async query(message, opts = {}) {
      let fullText = '';
      const toolCalls = [];

      await orchestrator.processUserMessageStreaming(message, {
        onText: (text) => { fullText += text; },
        onToolCall: (name, input) => { toolCalls.push({ name, input }); },
        onToolResult: () => {},
        onThinking: () => {},
        onRetry: () => {},
        onTodo: () => {},
        onAskUser: () => {},
        onDone: () => {},
        onError: () => {},
      }, opts);

      return { text: fullText, toolCalls, usage: contextManager.getUsage() };
    },

    /**
     * Send a message and get streaming events via async iterator.
     * @param {string} message
     * @param {Object} [opts]
     * @returns {AsyncGenerator<{ type: string, data: any }>}
     */
    async *stream(message, opts = {}) {
      const queue = [];
      let resolve = null;
      let done = false;

      const push = (type, data) => {
        const event = { type, data };
        if (resolve) { const r = resolve; resolve = null; r(event); }
        else queue.push(event);
      };

      // Run in background
      const processing = orchestrator.processUserMessageStreaming(message, {
        onText: (text) => push('text', { text }),
        onThinking: (phase, text) => push('thinking', { phase, text }),
        onRetry: (attempt, delay, err) => push('retry', { attempt, delay, error: err.message }),
        onToolCall: (name, input) => push('tool_call', { name, input }),
        onToolResult: (name, result) => push('tool_result', { name, preview: result?.substring(0, 300) }),
        onTodo: (todos) => push('todo', { todos }),
        onAskUser: (q) => push('ask_user', q),
        onDone: () => { push('done', {}); done = true; },
        onError: (err) => { push('error', { message: err }); done = true; },
      }, opts).catch(e => { push('error', { message: e.message }); done = true; });

      while (!done || queue.length > 0) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          yield await new Promise(r => { resolve = r; });
        }
      }

      await processing;
    },

    /** Get current context usage stats */
    getContext() {
      return {
        usage: contextManager.getUsage(),
        project: projectContext.getSummary(),
        symbols: symbolIndex?.getStats() || null,
      };
    },

    /** Access internal components */
    get orchestrator() { return orchestrator; },
    get projectContext() { return projectContext; },
    get symbolIndex() { return symbolIndex; },
    get toolRegistry() { return toolRegistry; },

    /** Clean up resources */
    destroy() {
      contextManager.messages = [];
    },
  };
}
