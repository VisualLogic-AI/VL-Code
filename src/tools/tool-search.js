/**
 * ToolSearch - discovers and activates deferred tools on demand
 *
 * When many tools are registered (especially MCP tools), not all are loaded
 * into the initial API call to save token budget. The LLM uses ToolSearch
 * to discover available deferred tools and activate them for subsequent turns.
 */
export function createToolSearchTool(toolRegistry) {
  return {
    description: 'Search for and activate additional tools not loaded by default. Use this when you need a tool that is not in your current tool list, or to discover what extra tools are available (e.g., MCP tools, specialized analysis tools).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to filter tools by name or description. Leave empty to list all available deferred tools.',
        },
        activate: {
          type: 'string',
          description: 'Tool name to activate. Once activated, the tool will be available in subsequent turns.',
        },
      },
    },
    execute: async (input) => {
      const { query, activate } = input;

      // Activate a specific deferred tool
      if (activate) {
        const success = toolRegistry.activateDeferred(activate);
        if (success) {
          return `Tool "${activate}" activated. It will be available in your next turn.`;
        }
        // Check if it's already active
        if (toolRegistry.has(activate)) {
          return `Tool "${activate}" is already active.`;
        }
        return `Tool "${activate}" not found in deferred tools.`;
      }

      // List/search deferred tools
      const deferred = toolRegistry.listDeferredTools();
      if (deferred.length === 0) {
        return 'No deferred tools available. All registered tools are already active.';
      }

      let results = deferred;
      if (query) {
        const q = query.toLowerCase();
        results = deferred.filter(t =>
          t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
      }

      if (results.length === 0) {
        return `No deferred tools matching "${query}". Available deferred tools: ${deferred.map(t => t.name).join(', ')}`;
      }

      const listing = results.map(t => `- ${t.name}: ${t.description}`).join('\n');
      return `Available deferred tools (${results.length}):\n${listing}\n\nUse ToolSearch with activate="<name>" to activate a tool.`;
    },
  };
}
