/**
 * VLCompile Tool - compiles the VL project via parsevl API
 * Just calls /api/compile directly. No pre-analysis needed.
 */

export function createVLCompileTool(config) {
  return {
    name: 'VLCompile',
    description: `Compile the VL project by calling the parsevl API. This uploads all VL files as a ZIP and returns preview URLs and any compile errors. Just call this directly — no need to validate or analyze files first.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      try {
        const port = config.port || 3200;
        const res = await fetch(`http://localhost:${port}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();

        if (data.error) {
          return JSON.stringify({ success: false, error: data.error });
        }

        const result = {
          success: true,
          gid: data.gid,
          previewUrls: data.previewUrls || {},
          errCount: data.errCount || 0,
        };
        if (data.errList?.length) {
          result.errList = data.errList;
        }
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return JSON.stringify({ success: false, error: e.message });
      }
    },
  };
}
