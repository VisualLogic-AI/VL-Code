/**
 * AskUserQuestion tool — lets the LLM ask the user interactive questions
 * with single-select or multi-select options, rendered in the web UI.
 *
 * The orchestrator intercepts this tool call and sends a special SSE event
 * to the web UI, which shows a choice widget. The user's selection is
 * returned as the tool result.
 */
export function createAskUserTool() {
  return {
    description: `Ask the user a question with predefined options. Use this when you need user input to proceed — e.g., choosing between approaches, confirming destructive actions, or selecting preferences. The user sees a UI widget with clickable options.`,
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question to ask the user. Should be clear and specific.',
        },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Short display text (1-5 words)' },
              description: { type: 'string', description: 'Explanation of what this option means' },
            },
            required: ['label'],
          },
          description: 'Available choices (2-5 options). An "Other" free-text option is always added automatically.',
          minItems: 2,
          maxItems: 5,
        },
        multiSelect: {
          type: 'boolean',
          description: 'If true, user can select multiple options. Default: false.',
          default: false,
        },
      },
      required: ['question', 'options'],
    },
    // Execute is handled specially by orchestrator — this is just fallback
    execute: async (input) => {
      return `Question asked: "${input.question}" — awaiting user response.`;
    },
  };
}
