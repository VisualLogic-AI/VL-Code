/**
 * DocCenter Tool — interact with the VL DocCenter API
 *
 * Base URL: https://v4pre.visuallogic.ai/api/12027022
 * Auth: Cookie ih5bearer=<jwt_token> (from project profile config.cookie)
 *
 * Actions:
 *   listDocs    — search/list documents (pagination, keyword, tag filter)
 *   getDoc      — get full document content by ID
 *   createDoc   — create new document
 *   saveDoc     — save document content (no version)
 *   publishDoc  — save as new version (with changeNote)
 *   deleteDoc   — delete document
 *   getTags     — list all tags
 *   createTag   — create new tag
 *   setDocTags  — set tags on a document
 *   getVersions — get version history
 *   resolveRef  — resolve workflow document reference (e.g. "12" or "12@v3")
 */
const BASE_URL = 'https://v4pre.visuallogic.ai/api/12027022';

export function createDocCenterTool(config) {
  return {
    description: `Interact with VL DocCenter API — a cloud document storage with versioning.
Use this to read PRD, specs, design docs, and auxiliary files from the doc center.
Also use it to save generated artifacts (ServiceMap, UIMap, workflows) as versioned documents.
Actions: listDocs, getDoc, createDoc, saveDoc, publishDoc, deleteDoc, getTags, createTag, setDocTags, getVersions, resolveRef`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['listDocs', 'getDoc', 'createDoc', 'saveDoc', 'publishDoc', 'deleteDoc',
                 'getTags', 'createTag', 'setDocTags', 'getVersions', 'resolveRef'],
          description: 'API action to perform',
        },
        // listDocs params
        keyword: { type: 'string', description: 'Search keyword for doc name (listDocs)' },
        tagId: { type: 'number', description: 'Filter by tag ID (listDocs, 0=all)' },
        page: { type: 'number', description: 'Page number, starts at 1 (listDocs)' },
        pageSize: { type: 'number', description: 'Items per page (listDocs)' },
        // getDoc / deleteDoc / getVersions params
        docId: { type: 'number', description: 'Document ID' },
        // createDoc params
        name: { type: 'string', description: 'Document name (unique)' },
        description: { type: 'string', description: 'Document description' },
        path: { type: 'string', description: 'Document path (unique, immutable after create)' },
        // saveDoc / publishDoc params
        currentContent: { type: 'string', description: 'Document content string' },
        changeNote: { type: 'string', description: 'Version change note (required for publishDoc)' },
        // createTag params
        color: { type: 'string', description: 'Tag color: blue/green/orange/red/purple/gray' },
        // setDocTags params
        tagIds: { type: 'array', items: { type: 'number' }, description: 'Array of tag IDs to set on document' },
        // resolveRef params
        refString: { type: 'string', description: 'Doc reference: "docId" or "docId@vN"' },
      },
      required: ['action'],
    },
    execute: async (input) => {
      const cookie = config.cookie;
      if (!cookie) {
        return { error: 'DocCenter requires authentication. Set cookie in Settings (ih5bearer JWT token).' };
      }

      const headers = {
        'Content-Type': 'application/json',
        'Cookie': `ih5bearer=${cookie}`,
      };

      const post = async (endpoint, body) => {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        const text = await res.text();
        try { return JSON.parse(text); } catch { return { raw: text }; }
      };

      try {
        switch (input.action) {
          case 'listDocs':
            return await post('SERVICE_DocCenter_GetDocList', {
              keyword: input.keyword || '',
              tagId: input.tagId || 0,
              page: input.page || 1,
              pageSize: input.pageSize || 20,
            });

          case 'getDoc':
            if (!input.docId) return { error: 'docId required' };
            return await post('SERVICE_DocCenter_GetDocById', { docId: input.docId });

          case 'createDoc':
            if (!input.name || !input.path) return { error: 'name and path required' };
            return await post('SERVICE_DocCenter_CreateDoc', {
              name: input.name, description: input.description || '', path: input.path,
            });

          case 'saveDoc':
            if (!input.docId || !input.currentContent) return { error: 'docId and currentContent required' };
            return await post('SERVICE_DocCenter_SaveDoc', {
              docId: input.docId, name: input.name || '', description: input.description || '',
              currentContent: input.currentContent,
            });

          case 'publishDoc':
            if (!input.path || !input.currentContent || !input.changeNote) {
              return { error: 'path, currentContent, and changeNote required' };
            }
            return await post('SERVICE_DocCenter_SaveAsVersion', {
              path: input.path, name: input.name || '', description: input.description || '',
              currentContent: input.currentContent, changeNote: input.changeNote,
            });

          case 'deleteDoc':
            if (!input.docId) return { error: 'docId required' };
            return await post('SERVICE_DocCenter_DeleteDoc', { docId: input.docId });

          case 'getTags':
            return await post('SERVICE_DocCenter_GetAllTags', {});

          case 'createTag':
            if (!input.name || !input.color) return { error: 'name and color required' };
            return await post('SERVICE_DocCenter_CreateTag', { name: input.name, color: input.color });

          case 'setDocTags':
            if (!input.docId || !input.tagIds) return { error: 'docId and tagIds required' };
            return await post('SERVICE_DocCenter_UpdateDocTags', { docId: input.docId, tagIds: input.tagIds });

          case 'getVersions':
            if (!input.docId) return { error: 'docId required' };
            return await post('SERVICE_DocCenter_GetVersionHistory', { docId: input.docId });

          case 'resolveRef':
            if (!input.refString) return { error: 'refString required' };
            return await post('SERVICE_DocCenter_ResolveDocRef', { refString: input.refString });

          default:
            return { error: `Unknown action: ${input.action}` };
        }
      } catch (err) {
        return { error: `DocCenter API error: ${err.message}` };
      }
    },
  };
}
