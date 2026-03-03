/**
 * TodoWrite Tool - task list management (work memory)
 * Mirrors Claude Code's TodoWrite: pending → in_progress → completed
 */
export function createTodoWriteTool() {
  return {
    description: 'Create or update a task list to track progress. Each todo has content, activeForm (present tense), and status (pending/in_progress/completed). Only one task should be in_progress at a time.',
    parameters: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'Task description (imperative form)' },
              activeForm: { type: 'string', description: 'Present tense form shown during execution' },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            },
            required: ['content', 'status', 'activeForm'],
          },
        },
      },
      required: ['todos'],
    },
    // Execution handled directly in orchestrator
    execute: async (input) => 'Todos updated successfully.',
  };
}
