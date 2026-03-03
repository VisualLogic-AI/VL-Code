/**
 * Configuration loader
 * Priority: CLI args → .env file → environment variables → defaults
 * Supports runtime updates via web IDE settings panel
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'));
export const APP_VERSION = PKG.version;

/** Load .env file if present */
function loadEnvFile(dir) {
  const envPath = path.join(dir, '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // No .env file, that's fine
  }
}

export function loadConfig(args) {
  // Determine work dir first (needed for .env loading)
  let workDir = process.cwd();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' || args[i] === '-d') {
      workDir = path.resolve(args[++i]);
    }
  }

  // Load .env from working directory and project root
  loadEnvFile(workDir);
  loadEnvFile(process.cwd());

  const config = {
    // API — default to Claude Opus 4.6
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.VL_CODE_API_KEY || '',
    model: process.env.VL_CODE_MODEL || 'claude-opus-4-6',
    maxOutputTokens: parseInt(process.env.VL_CODE_MAX_OUTPUT_TOKENS || '16000', 10),

    // Working directory
    workDir,

    // Web mode
    web: false,
    port: parseInt(process.env.VL_CODE_PORT || '3200', 10),

    // VL Workflow API
    workflowApiUrl: process.env.VL_WORKFLOW_API_URL || 'https://editor.visuallogic.ai/ih5/play/stream',
    workspaceApiUrl: process.env.VL_WORKSPACE_API_URL || 'https://editor.visuallogic.ai/ih5/editor/workspace',
    vlParseApiUrl: process.env.VL_PARSE_API_URL || 'https://editor.visuallogic.ai/edtfn/parsevl',
  };

  // Parse CLI args (override everything)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dir' || arg === '-d') {
      i++; // Already handled above
    } else if (arg === '--model' || arg === '-m') {
      config.model = args[++i];
    } else if (arg === '--api-key') {
      config.apiKey = args[++i];
    } else if (arg === '--max-tokens') {
      config.maxOutputTokens = parseInt(args[++i], 10);
    } else if (arg === '--web' || arg === '-w') {
      config.web = true;
    } else if (arg === '--port' || arg === '-p') {
      config.port = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log(`vl-code v${APP_VERSION}`);
      process.exit(0);
    }
  }

  // In web mode, don't require API key at startup (can be set via IDE)
  if (!config.apiKey && !config.web) {
    console.error('Error: ANTHROPIC_API_KEY is required.');
    console.error('Set it with: export ANTHROPIC_API_KEY=your-key-here');
    console.error('Or create a .env file in your project directory.');
    console.error('Or use --web mode and set the key in the browser IDE Settings.');
    process.exit(1);
  }

  return config;
}

/** Save API key to .env file (for persistence across restarts) */
export function saveApiKeyToEnv(workDir, apiKey) {
  const envPath = path.join(workDir, '.env');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf-8');
  } catch {
    // File doesn't exist yet
  }

  // Replace or append ANTHROPIC_API_KEY
  const lines = content.split('\n');
  let found = false;
  const updated = lines.map(line => {
    if (line.trim().startsWith('ANTHROPIC_API_KEY=')) {
      found = true;
      return `ANTHROPIC_API_KEY=${apiKey}`;
    }
    return line;
  });
  if (!found) {
    updated.push(`ANTHROPIC_API_KEY=${apiKey}`);
  }

  fs.writeFileSync(envPath, updated.join('\n'), 'utf-8');
}

function printUsage() {
  console.log(`
Usage: vl-code [options]

Options:
  -d, --dir <path>         Working directory (default: current directory)
  -m, --model <model>      Claude model (default: claude-opus-4-6)
  --api-key <key>          Anthropic API key (or set ANTHROPIC_API_KEY)
  --max-tokens <n>         Max output tokens (default: 16000)
  -w, --web                Start browser-based IDE
  -p, --port <port>        Web server port (default: 3200)
  -h, --help               Show this help

Environment Variables:
  ANTHROPIC_API_KEY        API key for Claude (can also use .env file)
  VL_CODE_MODEL            Model name (default: claude-opus-4-6)
  VL_CODE_MAX_OUTPUT_TOKENS  Max output tokens
  VL_CODE_PORT             Web server port

Models:
  claude-opus-4-6          Claude Opus 4.6 (default, most capable)
  claude-sonnet-4-6        Claude Sonnet 4.6 (faster, cheaper)
  claude-haiku-4-5-20251001  Claude Haiku 4.5 (fastest, cheapest)

Commands (in interactive mode):
  /help       Show help
  /status     Full context/symbol/cache status
  /files      Project file tree
  /graph      Dependency graph
  /symbols    Symbol index statistics
  /scan       Full project scan (impact analysis)
  /validate   Validate VL files
  /fix        Auto-fix VL syntax issues
  /plan       Enter plan mode
  /quit       Exit
`);
}
