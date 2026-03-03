<p align="center">
  <img src="https://raw.githubusercontent.com/VisualLogic-AI/VisualLogic.ai-VL/main/assets/logo.png" alt="VL-Code" width="420"/>
</p>

<h1 align="center">VL-Code: AI IDE for Visual Language</h1>

<p align="center">
  <strong>Build full-stack applications from natural language.</strong><br/>
  Powered by Claude AI + Visual Language (VL) v2.91
</p>

<p align="center">
  <a href="https://github.com/VisualLogic-AI/VisualLogic.ai-VL">VL Language Spec</a> &nbsp;|&nbsp;
  <a href="https://editor.visuallogic.ai">VL Platform</a> &nbsp;|&nbsp;
  <a href="https://discord.com/invite/KdaVtR7pzv">Discord</a> &nbsp;|&nbsp;
  <a href="https://www.youtube.com/playlist?list=PLJE6c8wBknRnCZIRv_VFa1dYswTSqoW21">YouTube</a>
</p>

---

## What is VL-Code?

VL-Code is an **AI-native IDE** that generates complete, deployable applications from natural language descriptions. It uses **Visual Language (VL)** — a minimal, deterministic programming language designed specifically for AI code generation — as an intermediate representation between human intent and executable code.

Unlike traditional AI coding assistants that patch existing code, VL-Code runs a **multi-agent pipeline** that produces full-stack applications: database schemas, service APIs, UI components, and app routing — all from a single prompt.

The result is compiled to **JavaScript + Java/Node.js** and deployed to the web instantly.

<p align="center">
  <img src="https://raw.githubusercontent.com/VisualLogic-AI/VisualLogic.ai-VL/main/assets/images/vl-code-editor.png" alt="VL-Code Editor" width="90%"/>
  <br/><em>VL-Code Editor — AI-powered code editing with VL syntax highlighting</em>
</p>

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Anthropic API Key** — [Get one here](https://console.anthropic.com/settings/keys)

### One-Command Install

```bash
git clone https://github.com/VisualLogic-AI/VL-Code.git
cd VL-Code
bash install.sh
```

The installer will prompt for your API key and set everything up.

### Manual Install

```bash
git clone https://github.com/VisualLogic-AI/VL-Code.git
cd VL-Code
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run web
```

Then open **http://localhost:3200** in your browser.

---

## Try the Example Project

```bash
# Open the Concert Registration example
vl-code --web --dir examples/ConcertReg
```

This loads a complete Concert Registration app with:
- 1 App definition, 9 Sections, 5 Services
- 8 Reusable Components, 1 Database Schema
- Full architectural artifacts (PRD, ServiceMap, UIMap)

Or start from scratch:

```bash
vl-code --web --dir examples/starter
```

---

## Features

### AI-Powered Development
- **8-Agent Generation Pipeline** — natural language to full-stack app
- **AI Chat** with full project context awareness
- **AI Draft Replies** for GitHub issues and PRs
- **Smart Context Loading** — dependency graph auto-loads related files

### Visual Language Intelligence
- **25+ AI Tools** — file ops, code generation, validation, testing
- **Semantic Symbol Index** — go-to-definition, find references, autocomplete
- **Impact Analysis** — detect breaking changes before they happen
- **Auto-Fix Engine** — automatic VL syntax repair

### Development Experience
- **Web IDE** at localhost:3200 with CodeMirror editor
- **Visual Workflow Editor** — design AI pipelines as DAGs
- **Blueprint Architecture** — living PRD, ServiceMap, UIMap
- **Session Persistence** — conversations survive restarts
- **Multi-Workspace** — switch between VL projects

<p align="center">
  <img src="https://raw.githubusercontent.com/VisualLogic-AI/VisualLogic.ai-VL/main/assets/images/vl-code-flow-editor.png" alt="VL-Code Flow Editor" width="90%"/>
  <br/><em>Flow Editor — Visual workflow DAG for multi-agent orchestration</em>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/VisualLogic-AI/VisualLogic.ai-VL/main/assets/images/vl-code-meta-editor.png" alt="VL-Code Meta Editor" width="90%"/>
  <br/><em>Meta Editor — Architecture overview and agent pipeline visualization</em>
</p>

---

## VL File Types

VL covers the full stack through six file types:

| Extension | Purpose | Description |
|-----------|---------|-------------|
| `.vx` | App | Navigation, routing, configuration |
| `.sc` | Section | UI tree, state, events, styles |
| `.cp` | Component | Reusable props-driven UI blocks |
| `.vs` | Service | API contracts, domain logic |
| `.vdb` | Database | Tables, columns, types, relations |
| `.vth` | Theme | Colors, typography, spacing tokens |

```
APP MyApp
--title: My Application
--theme: Theme-Default

SECTION Dashboard
--$userCount(INT) = 0

--HANDLER onLoad()
----CALL UserDomain.getStats()
------ON SUCCESS
--------SET $userCount = result.total

--<Column "root">
----<StatCard "users"> label:"Total Users" value:$userCount
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `VL_CODE_MODEL` | `claude-sonnet-4-6` | Claude model to use |
| `VL_CODE_PORT` | `3200` | Web IDE port |

You can also change the model and API key in the Web IDE Settings panel.

---

## 8-Agent Generation Pipeline

Give VL-Code a product requirement in natural language:

| # | Agent | Output |
|---|-------|--------|
| 1 | Requirements Analyst | PRD document |
| 2 | Data Architect | Database schema (`.vdb`) |
| 3 | Service Designer | API contracts (`.vs`) |
| 4 | UI Architect | Screen/component breakdown |
| 5 | Component Builder | Reusable UI components (`.cp`) |
| 6 | Service Coder | Business logic (`.vs`) |
| 7 | Screen Builder | Screens with state & events (`.sc`) |
| 8 | App Assembler | App with routing (`.vx`) |

Stages 5-8 run **in parallel** using independent agents. The result: a fully compilable, deployable application.

---

## Project Structure

```
VL-Code/
├── bin/vl-code.js          # CLI entry point
├── src/
│   ├── index.js            # Main VLCode class
│   ├── core/               # Agent orchestrator, prompt engine, sessions
│   ├── vl/                 # VL language intelligence (symbol index, codegen, auto-fix)
│   ├── tools/              # 25+ AI tools (file ops, validation, testing)
│   ├── web/                # Express server + Web IDE frontend
│   ├── sdk/                # Programmatic API
│   ├── utils/              # Config, utilities
│   └── data/               # VL syntax specification
├── examples/
│   ├── ConcertReg/         # Complete example project
│   └── starter/            # Minimal template
├── .vl-code/               # Project config and workflows
├── install.sh              # One-click installer
└── package.json
```

---

## SDK / Programmatic API

```javascript
import { createAgent } from './src/sdk/index.js';

const agent = await createAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  workDir: './my-vl-project'
});

const result = await agent.query('Create a login section with email and password');
console.log(result.text);
```

---

## Browser Testing (Optional)

VL-Code includes Playwright-powered browser testing for visual verification:

```bash
# Install browser (one-time)
npx playwright install chromium

# Then use the browser-inspect tool in the Web IDE
```

---

## Contributing

We welcome contributions! Here's how:

- **Tools** (`src/tools/`) — add new AI tools or improve existing ones
- **Frontend** (`src/web/public/`) — UI improvements and features
- **Examples** (`examples/`) — share your VL projects
- **Documentation** — improve docs and guides
- **Bug Reports** — open issues with reproduction steps

> Note: Some core engine files are protected. This does not affect your ability to extend VL-Code through the tools system, frontend, or SDK.

---

## Related Projects

- [VisualLogic.ai-VL](https://github.com/VisualLogic-AI/VisualLogic.ai-VL) — VL language specification, documentation, and examples
- [VL Platform](https://editor.visuallogic.ai) — Cloud IDE with visual graph editor and compiler
- [Discord Community](https://discord.com/invite/KdaVtR7pzv) — Ask questions and share projects

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>VL-Code: Where AI meets visual programming.</strong><br/>
  <em>Build anything. Ship everything.</em>
</p>
