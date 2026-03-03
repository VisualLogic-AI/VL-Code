/**
 * WorkspaceAPI Tool - interacts with the VL Workspace REST API
 * Endpoints: createFile, listFile, readFile, writeFile, deleteFile (+ batch versions)
 * Also: createDoc, readDoc, writeDoc, deleteDoc
 */
export function createWorkspaceAPITool(config) {
  const baseUrl = config.workspaceApiUrl || 'https://editor.visuallogic.ai/ih5/editor/workspace';

  return {
    description: `Interact with the VL Workspace API for remote file/document management.
Actions: createFile, listFile, readFile, writeFile, deleteFile, createFiles, readFiles, writeFiles, deleteFiles, createDoc, readDoc, writeDoc, deleteDoc, listDoc.`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'createFile', 'listFile', 'readFile', 'writeFile', 'deleteFile',
            'createFiles', 'readFiles', 'writeFiles', 'deleteFiles',
            'createDoc', 'listDoc', 'readDoc', 'writeDoc', 'deleteDoc',
          ],
          description: 'API action to perform',
        },
        gid: {
          type: 'string',
          description: 'Group/workspace ID',
        },
        path: {
          type: 'string',
          description: 'File or document path',
        },
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Multiple file paths (for batch operations)',
        },
        content: {
          type: 'string',
          description: 'File content (for write operations)',
        },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
            },
          },
          description: 'Multiple files (for batch write)',
        },
        version: {
          type: 'string',
          description: 'Specific version to read (optional)',
        },
        shared: {
          type: 'boolean',
          description: 'Whether doc is shared (for doc operations)',
        },
      },
      required: ['action'],
    },
    execute: async (input) => {
      const { action, ...params } = input;
      const url = `${baseUrl}/${action}`;

      try {
        const body = {};
        if (params.gid) body.gid = params.gid;
        if (params.path) body.path = params.path;
        if (params.paths) body.paths = params.paths;
        if (params.content !== undefined) body.content = params.content;
        if (params.files) body.files = params.files;
        if (params.version) body.version = params.version;
        if (params.shared !== undefined) body.shared = params.shared;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          return `API error: ${response.status} ${response.statusText}`;
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
          return `${action}: Success (no return value)`;
        }

        try {
          const json = JSON.parse(text);
          return JSON.stringify(json, null, 2);
        } catch {
          return text;
        }
      } catch (err) {
        return `WorkspaceAPI error: ${err.message}`;
      }
    },
  };
}
