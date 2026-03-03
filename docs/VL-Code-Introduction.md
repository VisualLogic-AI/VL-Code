# VL-Code: AI IDE for Visual Language

**The fully automated, LLM-powered development platform that turns ideas into production-ready applications — with almost zero coding required.**

---

## What is VL-Code?

VL-Code is a next-generation AI IDE built on **Visual Language (VL)** — a compact, complete, and fully structured programming language designed from the ground up for the AI era. It combines the power of large language models with a visual, component-oriented programming paradigm to deliver a complete system for workflow design, application generation, testing, debugging, and deployment.

Think of it as **Claude Code + Dify + a visual low-code platform** — unified into a single, coherent development experience that runs locally and deploys to the cloud.

---

## Core Philosophy

### LLM as the Logic Engine

At the heart of VL-Code is a simple but powerful idea: **the LLM is not just an assistant — it is the core execution engine**. Every stage of the development lifecycle — from requirements analysis to code generation to debugging to deployment — is driven by LLM intelligence, orchestrated through visual, non-linear workflows.

### A Language Built for AI

VL is not another general-purpose language retrofitted for AI. It is a **micro-scale, fully self-consistent, declarative language** purpose-built so that LLMs can read, write, reason about, and generate it with near-perfect accuracy. Its component-oriented architecture gives the entire system a powerful capacity for **self-growth** — new components, services, and entire applications can be composed from existing building blocks, by humans and AI alike.

### Bidirectional Code ↔ Visual Conversion

Every VL program has a direct, lossless mapping to a graphical representation and vice versa. Developers can work in code, switch to a visual canvas, make adjustments with drag-and-drop, and switch back — without losing a single character. This is the **"graphical escape hatch"** that makes VL-Code accessible to everyone, from seasoned engineers to people who have never written a line of code.

---

## How It Works

### Non-Linear Workflow Engine (Not Just "Plan")

Unlike tools that follow a simple linear plan → execute model, VL-Code uses **visual, non-linear workflow DAGs** (Directed Acyclic Graphs) as its primary orchestration mechanism. Each workflow node can:

- Call an LLM with specific context and instructions
- Spawn **sub-agents** for parallel, specialized tasks
- Branch conditionally based on results
- Loop over collections (files, components, services)
- Fork into parallel execution paths
- Write files, set variables, or trigger further workflows

These workflows are **fully visual** — you can see every node, every data flow, every decision point. And they pervade **every phase**: development, runtime, debugging, adjustment, and operations.

### 8-Agent Full-Stack Generation Pipeline

Give VL-Code a product requirement in plain language, and it executes an automated 8-agent pipeline:

| Stage | Agent | Output |
|-------|-------|--------|
| 1 | Requirements Analyst | PRD (Product Requirements Document) |
| 2 | Data Architect | Database schema (`.vdb`) |
| 3 | Service Designer | Service map with API contracts (`.vs`) |
| 4 | UI Architect | UI map with section/component breakdown |
| 5 | Component Builder | Reusable UI components (`.cp`) — parallel |
| 6 | Service Coder | Service domain logic (`.vs`) — parallel |
| 7 | Screen Builder | Screen sections with state & events (`.sc`) — parallel |
| 8 | App Assembler | App definitions with routing (`.vx`) — parallel |

The entire pipeline streams progress in real time. After completion, you get a **fully compilable, deployable application** with preview URLs.

### The Developer's Role: Final-Mile Refinement

VL-Code is designed so that **almost the entire journey from idea to deployment requires no human intervention**. But developers aren't removed from the picture — they are elevated to the role of **creative director**. At the final adjustment stage, developers step in through the visual interface to:

- Fine-tune UI layouts and styling
- Adjust business logic at key decision points
- Review and approve architectural choices
- Polish the user experience

This is especially powerful for **non-technical creators** who can meaningfully participate in application development through an intuitive graphical interface, without ever touching code.

---

## The VL Language

Visual Language (VL) v2.91 is a **declarative, component-oriented, full-stack language** with six file types covering every layer of an application:

| Extension | Purpose | Example |
|-----------|---------|---------|
| `.vx` | App definition — navigation, routing, configuration | `MyApp.vx` |
| `.sc` | Screen section — UI tree, state, event handlers, styles | `UserList.sc` |
| `.cp` | Reusable component — props, events, encapsulated UI | `DataTable.cp` |
| `.vs` | Service domain — API contracts, data operations | `UserDomain.vs` |
| `.vdb` | Database schema — tables, columns, types, relations | `Project.vdb` |
| `.vth` | Theme — design tokens, colors, typography, spacing | `Brand.vth` |

### Key Language Features

- **Dash-based tree indentation** — clean, unambiguous hierarchy without brace/bracket noise
- **`$variable` naming** — instant visual distinction between state and structure
- **`@event` system** — declarative event binding with clear data flow
- **Component composition** — components reference components, sections reference services, apps reference sections
- **Full-stack in one paradigm** — from database schema to UI styling, all in VL

```
// VL_VERSION:2.91

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

## Intelligence Built In

### Semantic Code Understanding

VL-Code doesn't just store files — it **understands them**. A real-time symbol index tracks every declaration, reference, variable, and theme token across your entire project, enabling:

- **Go-to-definition** — jump to any symbol's source instantly
- **Find all references** — see every place a component, service, or variable is used
- **Autocomplete** — context-aware suggestions as you type
- **Impact analysis** — before you rename or remove anything, see exactly what will break

### Smart Context Loading

A dependency graph engine automatically traces relationships between files. When you ask the AI about a screen section, it automatically loads the relevant services, components, database schemas, and theme tokens — giving the LLM full situational awareness without manual context management.

### Blueprint Architecture Engine

VL-Code maintains a living architectural model of your project — the PRD, service map, UI map, and data model — and automatically injects the relevant context when editing any file. The AI always knows **what a section is supposed to do**, not just what the code says.

### Auto-Fix Engine

Common VL syntax issues are detected and repaired automatically — indentation errors, naming convention violations, missing headers, section ordering problems — keeping your codebase clean without manual intervention.

---

## Ecosystem Integration

VL-Code is designed as an **open integration hub**:

- **Any LLM** — Claude (default), or swap in other models as needed
- **MCP (Model Context Protocol)** — plug in any MCP-compatible tool or data source
- **Skills** — extensible slash-command system for specialized operations
- **Libraries, modules, APIs** — import external capabilities and rapidly restructure them into native VL components
- **Cloud deployment** — compile locally, deploy to the VL Platform with one command, get instant preview URLs

### DocCenter Integration

A built-in cloud document management system for storing and versioning specifications, blueprints, and project documentation — with full CRUD, tagging, and publishing support.

### Browser Automation & Testing

Playwright-powered browser inspection and component testing lets the AI visually verify compiled applications — clicking buttons, checking layouts, reading console output — closing the loop between generation and validation.

---

## Development ↔ Production

VL-Code applications aren't prototypes — they are **production-ready**:

1. **Develop locally** — full IDE experience with real-time validation, symbol intelligence, and AI assistance
2. **Compile** — submit to the VL compiler, get instant preview URLs
3. **Test** — automated browser-based component testing against the compiled app
4. **Debug** — visual workflow tracing, impact analysis, auto-fix
5. **Deploy** — publish to the VL Platform for internet-accessible production use

The same workflows that generate code also handle testing, debugging, and deployment — a **unified visual pipeline** from concept to production.

---

## Who Is VL-Code For?

| Audience | Value |
|----------|-------|
| **Non-technical creators** | Build real applications through visual interfaces and natural language, with a graphical escape hatch for fine-tuning |
| **Citizen developers** | Leverage AI-powered workflows to produce professional-grade applications without deep programming knowledge |
| **Professional developers** | Accelerate full-stack development with intelligent code generation, semantic tooling, and automated pipelines |
| **Enterprise teams** | Standardize application development on a structured, auditable, AI-native platform with built-in governance |

---

## Technical Highlights

- **Node.js + Express** backend with SSE streaming
- **CodeMirror 5** editor served locally (no CDN dependency)
- **Anthropic prompt caching** — 47K-token VL specification cached for near-zero repeated cost
- **4-segment prompt architecture** for optimal token efficiency
- **Exponential backoff retry** for API resilience
- **Incremental symbol indexing** — sub-second updates on file save
- **Session persistence** — conversations, todos, and decisions survive across restarts
- **Workspace management** — switch between multiple VL projects seamlessly

---

## Summary

VL-Code represents a new category of development tool — not just an AI coding assistant, but a **complete, AI-native development platform** where:

- **Workflows replace plans** — non-linear, visual, with sub-agents at every node
- **The LLM is the engine** — not a helper, but the core intelligence driving every phase
- **A purpose-built language** — VL is small enough for AI to master, powerful enough to build real applications
- **Automation is the default** — from requirements to deployment, with human creativity applied where it matters most
- **Everyone can build** — the graphical escape hatch makes professional application development accessible to all

**VL-Code: Where AI meets visual programming. Build anything. Ship everything.**
