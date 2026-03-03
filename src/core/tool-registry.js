/**
 * Tool Registry - manages all available tools and their schemas
 * Mirrors Claude Code's tool system: each tool has a schema + executor
 *
 * Deferred Loading Strategy:
 *   Tools marked with `deferred: true` are NOT included in the initial API call.
 *   The LLM uses the ToolSearch tool to discover and activate them on-demand.
 *   This saves token budget when many tools (especially MCP tools) are registered.
 */
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this._skillFilter = null; // Set by orchestrator during skill execution
    this._activatedDeferred = new Set(); // Deferred tools activated this session
  }

  register(name, { description, parameters, execute, deferred = false }) {
    this.tools.set(name, { name, description, parameters, execute, deferred: !!deferred });
  }

  get(name) {
    return this.tools.get(name);
  }

  has(name) {
    return this.tools.has(name);
  }

  /** Get all tool schemas for API calls (Anthropic tool format) */
  getToolSchemas() {
    const schemas = [];
    for (const [name, tool] of this.tools) {
      // If a skill filter is active, only include allowed tools
      if (this._skillFilter && !this._skillFilter.includes(name)) continue;
      // Skip deferred tools unless they've been activated
      if (tool.deferred && !this._activatedDeferred.has(name)) continue;
      schemas.push({
        name,
        description: tool.description,
        input_schema: tool.parameters,
      });
    }
    // Add cache_control to last tool for prompt caching
    if (schemas.length > 0) {
      schemas[schemas.length - 1].cache_control = { type: 'ephemeral' };
    }
    return schemas;
  }

  /** Execute a tool by name with given input */
  async execute(name, input) {
    const tool = this.tools.get(name);
    if (!tool) {
      return { error: `Unknown tool: ${name}` };
    }
    // Auto-activate deferred tools on first execution
    if (tool.deferred && !this._activatedDeferred.has(name)) {
      this._activatedDeferred.add(name);
    }
    try {
      const result = await tool.execute(input);
      return { result };
    } catch (err) {
      return { error: err.message };
    }
  }

  /** Activate a deferred tool (make it available in subsequent API calls) */
  activateDeferred(name) {
    if (this.tools.has(name) && this.tools.get(name).deferred) {
      this._activatedDeferred.add(name);
      return true;
    }
    return false;
  }

  /** List deferred (not yet loaded) tools — for ToolSearch */
  listDeferredTools() {
    const deferred = [];
    for (const [name, tool] of this.tools) {
      if (tool.deferred && !this._activatedDeferred.has(name)) {
        deferred.push({ name, description: tool.description });
      }
    }
    return deferred;
  }

  /** List all tools including deferred (for diagnostics) */
  listTools() {
    return Array.from(this.tools.keys());
  }

  /** List active (non-deferred + activated) tool names */
  listActiveTools() {
    return Array.from(this.tools.entries())
      .filter(([name, tool]) => !tool.deferred || this._activatedDeferred.has(name))
      .map(([name]) => name);
  }
}
