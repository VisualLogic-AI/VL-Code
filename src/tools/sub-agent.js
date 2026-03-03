/**
 * SubAgent Tool - launches isolated sub-agents (mirrors Claude Code's Task tool)
 *
 * Agent types:
 *   - explore: read-only search and analysis
 *   - plan: design implementation approach
 *   - generate: create VL code following strict syntax rules
 *   - general: full read/write access, can complete complex sub-tasks autonomously
 *
 * Supports: background execution, model selection, resume, isolation
 */
export function createSubAgentTool() {
  return {
    description: `Launch a sub-agent to handle a focused task with isolated context. Types: "explore" (read-only search), "plan" (design approach), "generate" (create VL code), "general" (full access, autonomous sub-tasks). Sub-agents do not pollute the main context. Use runInBackground for non-blocking execution.`,
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed task description for the sub-agent.',
        },
        agentType: {
          type: 'string',
          enum: ['explore', 'plan', 'generate', 'general'],
          description: 'Type of sub-agent. "general" has full tool access including Edit/Write/Bash. Default: "explore".',
        },
        maxTurns: {
          type: 'number',
          description: 'Maximum agent turns before stopping. Default: 10.',
        },
        runInBackground: {
          type: 'boolean',
          description: 'Run agent in background without blocking the main conversation. Results are delivered when complete. Default: false.',
        },
        resume: {
          type: 'string',
          description: 'Agent ID to resume from a previous execution. The agent continues with its full previous context preserved.',
        },
        isolation: {
          type: 'string',
          enum: ['none', 'worktree'],
          description: '"worktree" creates a git worktree so the agent works on an isolated copy. Default: "none".',
        },
        model: {
          type: 'string',
          enum: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
          description: 'Model to use for this agent. Prefer haiku for quick tasks. Default: inherits from parent.',
        },
      },
      required: ['prompt'],
    },
    // Execution handled directly in orchestrator._runSubAgent()
    execute: async () => 'Sub-agent execution handled by orchestrator.',
  };
}
