/**
 * VL Parse Tool – Deploy/Preview VL projects via the VL Parse API
 *
 * API: POST https://editor.visuallogic.ai/edtfn/parsevl
 * Accepts a ZIP of VL project files, returns preview URLs and deployment packages.
 *
 * Flow:
 *   1. ZIP the project directory
 *   2. Base64 encode to data:application/zip;base64,...
 *   3. POST to parse API
 *   4. Return preview URLs, app case IDs, deployment package URLs
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function createVLParseTool(config) {
  return {
    description: 'Deploy and preview VL project: ZIPs the project, uploads to VL Parse API, returns preview URLs and deployment packages. Use after development is complete to see the live result.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['preview', 'deploy'],
          description: 'preview: get preview URLs only. deploy: get preview URLs + downloadable deployment packages.',
        },
        project_dir: {
          type: 'string',
          description: 'Path to VL project directory (default: current working directory)',
        },
        project_name: {
          type: 'string',
          description: 'Project name (optional)',
        },
        target_gid: {
          type: 'number',
          description: 'Target group application ID in VisualLogic platform (optional)',
        },
        cookie: {
          type: 'string',
          description: 'Authentication cookie for the VL Parse API. Required.',
        },
      },
      required: ['action', 'cookie'],
    },
    execute: async (input) => {
      const projectDir = input.project_dir || config.workDir;
      const isPreview = input.action === 'preview';

      // Auto-load Group ID from workspace profile if not provided
      const profilePath = path.join(projectDir, '.vl-code', 'project.json');
      let savedGid = null;
      try {
        if (fsSync.existsSync(profilePath)) {
          const profile = JSON.parse(fsSync.readFileSync(profilePath, 'utf-8'));
          savedGid = profile.groupId || null;
        }
      } catch {}

      try {
        // Step 1: ZIP the project
        const zipPath = path.join(projectDir, '__vl_deploy.zip');

        // Create ZIP with all VL files preserving directory structure
        try {
          execSync(
            `cd "${projectDir}" && find . -type f \\( -name "*.vx" -o -name "*.sc" -o -name "*.cp" -o -name "*.vs" -o -name "*.vdb" -o -name "*.vth" \\) | zip -@ "${zipPath}"`,
            { timeout: 30000 }
          );
        } catch (e) {
          return { error: `Failed to ZIP project: ${e.message}` };
        }

        // Step 2: Read ZIP and convert to base64 data URL
        const zipBuffer = await fs.readFile(zipPath);
        const base64 = zipBuffer.toString('base64');
        const dataUrl = `data:application/zip;base64,${base64}`;

        // Clean up temp ZIP
        await fs.unlink(zipPath).catch(() => {});

        // Step 3: Build request body
        const body = {
          action: 'parsePjt',
          file: dataUrl,
          download: !isPreview,
        };
        if (input.project_name) body.projectName = input.project_name;
        // Use provided GID, or fallback to saved GID from profile
        const targetGid = input.target_gid || savedGid;
        if (targetGid) body.targetGid = targetGid;

        // Step 4: Call VL Parse API
        const apiUrl = config.vlParseApiUrl || 'https://editor.visuallogic.ai/edtfn/parsevl';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': input.cookie,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          return { error: `API returned HTTP ${response.status}: ${response.statusText}` };
        }

        const result = await response.json();

        // Step 5: Parse response
        if (result.code !== 0) {
          return { error: `Parse API error (code ${result.code}): ${result.message}` };
        }

        const data = result.data || {};
        const output = [];

        output.push(`VL Parse ${isPreview ? 'Preview' : 'Deploy'} – Success`);
        output.push(`Group ID: ${data.gid || 'N/A'}`);

        // Save Group ID to workspace profile for reuse
        if (data.gid) {
          try {
            const vlCodeDir = path.join(projectDir, '.vl-code');
            if (!fsSync.existsSync(vlCodeDir)) fsSync.mkdirSync(vlCodeDir, { recursive: true });
            let profile = {};
            try { profile = JSON.parse(fsSync.readFileSync(profilePath, 'utf-8')); } catch {}
            profile.groupId = data.gid;
            if (data.nids?.length) profile.appCaseIds = data.nids;
            if (data.appPreviewUrlMap) profile.previewUrls = data.appPreviewUrlMap;
            fsSync.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
          } catch {}
        }

        // Preview URLs (with clickable markdown links)
        if (data.appPreviewUrlMap && Object.keys(data.appPreviewUrlMap).length > 0) {
          output.push(`\nPreview URLs:`);
          for (const [appId, url] of Object.entries(data.appPreviewUrlMap)) {
            output.push(`  [Open App ${appId}](${url})`);
          }
        }

        // App case IDs
        if (data.nids && data.nids.length > 0) {
          output.push(`\nApp Case IDs: ${data.nids.join(', ')}`);
        }

        // Package URLs
        if (data.packageUrls && data.packageUrls.length > 0) {
          output.push(`\nDeployment Packages:`);
          for (const url of data.packageUrls) {
            output.push(`  ${url}`);
          }
        }

        // Errors during processing
        if (data.errList && data.errList.length > 0) {
          output.push(`\nWarnings/Errors during parse:`);
          for (const err of data.errList) {
            output.push(`  ⚠ ${typeof err === 'string' ? err : JSON.stringify(err)}`);
          }
        }

        // App case JSON (summary)
        if (data.appCaseJsonMap && Object.keys(data.appCaseJsonMap).length > 0) {
          output.push(`\nApp Cases: ${Object.keys(data.appCaseJsonMap).length} app(s) parsed`);
        }

        return { result: output.join('\n') };
      } catch (e) {
        return { error: `VL Parse failed: ${e.message}` };
      }
    },
  };
}
