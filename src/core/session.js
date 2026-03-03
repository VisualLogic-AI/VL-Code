/**
 * Session Persistence – save/restore conversation state across sessions
 *
 * Claude Code loses all context when you close it. VL-Code can persist:
 *   - Conversation summary (compressed)
 *   - Todo list state
 *   - Key decisions and architectural choices
 *   - File change history
 *   - Symbol index (serialized)
 *
 * Sessions are stored in .vl-code/sessions/ within the project directory.
 */
import fs from 'fs/promises';
import path from 'path';

export class SessionManager {
  constructor(workDir) {
    this.workDir = workDir;
    this.sessionDir = path.join(workDir, '.vl-code', 'sessions');
    this.currentSession = null;
  }

  /** Initialize session directory */
  async init() {
    await fs.mkdir(this.sessionDir, { recursive: true });
  }

  /** Create a new session or resume the latest one */
  async startOrResume() {
    const sessions = await this.listSessions();
    if (sessions.length > 0) {
      const latest = sessions[0];
      // Resume if less than 24h old
      const age = Date.now() - latest.timestamp;
      if (age < 24 * 60 * 60 * 1000) {
        this.currentSession = await this.loadSession(latest.id);
        return { resumed: true, session: this.currentSession };
      }
    }

    // Create new session
    this.currentSession = {
      id: `session_${Date.now()}`,
      created: Date.now(),
      updated: Date.now(),
      summary: null,
      todos: [],
      decisions: [],
      fileChanges: [],
      turnCount: 0,
    };
    return { resumed: false, session: this.currentSession };
  }

  /** Save current session state */
  async save(extra = {}) {
    if (!this.currentSession) return;

    this.currentSession.updated = Date.now();
    Object.assign(this.currentSession, extra);

    const filePath = path.join(this.sessionDir, `${this.currentSession.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(this.currentSession, null, 2), 'utf-8');
  }

  /** Record a conversation summary for context recovery */
  async saveSummary(summary) {
    if (!this.currentSession) return;
    this.currentSession.summary = summary;
    this.currentSession.turnCount++;
    await this.save();
  }

  /** Record a key decision */
  async addDecision(decision) {
    if (!this.currentSession) return;
    this.currentSession.decisions.push({
      timestamp: Date.now(),
      ...decision,
    });
    // Keep last 50 decisions
    if (this.currentSession.decisions.length > 50) {
      this.currentSession.decisions = this.currentSession.decisions.slice(-50);
    }
    await this.save();
  }

  /** Record a file change */
  async addFileChange(filePath, changeType) {
    if (!this.currentSession) return;
    this.currentSession.fileChanges.push({
      timestamp: Date.now(),
      file: filePath,
      type: changeType,
    });
    // Keep last 200 changes
    if (this.currentSession.fileChanges.length > 200) {
      this.currentSession.fileChanges = this.currentSession.fileChanges.slice(-200);
    }
  }

  /** Update todo state */
  async saveTodos(todos) {
    if (!this.currentSession) return;
    this.currentSession.todos = todos;
    await this.save();
  }

  /** Get recovery context for a resumed session */
  getRecoveryContext() {
    if (!this.currentSession) return null;

    const parts = [];

    if (this.currentSession.summary) {
      parts.push(`Previous Session Summary:\n${this.currentSession.summary}`);
    }

    if (this.currentSession.todos.length > 0) {
      const todoText = this.currentSession.todos.map(t => {
        const icon = t.status === 'completed' ? '[✓]' : t.status === 'in_progress' ? '[→]' : '[ ]';
        return `${icon} ${t.content}`;
      }).join('\n');
      parts.push(`Previous Todos:\n${todoText}`);
    }

    if (this.currentSession.decisions.length > 0) {
      const recentDecisions = this.currentSession.decisions.slice(-10);
      parts.push(`Key Decisions:\n${recentDecisions.map(d => `- ${d.description || d.text}`).join('\n')}`);
    }

    if (this.currentSession.fileChanges.length > 0) {
      const recentChanges = this.currentSession.fileChanges.slice(-20);
      const changeGroups = {};
      for (const c of recentChanges) {
        changeGroups[c.file] = c.type;
      }
      parts.push(`Recent File Changes:\n${Object.entries(changeGroups).map(([f, t]) => `- ${f} (${t})`).join('\n')}`);
    }

    if (parts.length === 0) return null;

    return `<system-reminder>\nSession Recovery (from ${new Date(this.currentSession.created).toLocaleString()}):\n${parts.join('\n\n')}\n</system-reminder>`;
  }

  /** List all saved sessions, newest first */
  async listSessions() {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessions = [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = await fs.readFile(path.join(this.sessionDir, file), 'utf-8');
          const data = JSON.parse(content);
          sessions.push({
            id: data.id,
            timestamp: data.updated || data.created,
            turnCount: data.turnCount || 0,
            hasSummary: !!data.summary,
          });
        } catch { continue; }
      }
      return sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  /** Load a specific session */
  async loadSession(sessionId) {
    const filePath = path.join(this.sessionDir, `${sessionId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}
