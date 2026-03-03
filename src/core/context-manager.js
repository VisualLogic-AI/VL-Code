/**
 * Context Manager - tracks token usage and manages conversation compression
 *
 * Smart Compression Strategy (beyond Claude Code):
 *   - Uses Haiku for fast, cheap summarization (~0.5s, ~$0.001/compression)
 *   - Preserves "anchor turns": user decisions, file edits, error resolution
 *   - Two-phase compression: first summarize old turns, then if still over, summarize summary
 *   - Tracks compression history for debugging
 */
import Anthropic from '@anthropic-ai/sdk';

export class ContextManager {
  constructor(config) {
    this.config = config;
    this.maxTokens = 200000; // Claude context window
    this.maxOutputTokens = config.maxOutputTokens || 16000;
    this.messages = [];
    this.turnCount = 0;
    this.estimatedTokens = 0;
    this.systemTokens = 0;
    this.toolTokens = 0;
    this.compressionThreshold = 0.85; // Compress at 85% usage
    this.client = null;

    // Real token tracking from API response
    this.hasRealUsage = false;
    this.lastInputTokens = 0;
    this.lastOutputTokens = 0;
    this.cacheCreation = 0;
    this.cacheRead = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;

    // Compression history
    this.compressionCount = 0;
    this.totalTokensSaved = 0;
  }

  setSystemTokenEstimate(tokens) {
    this.systemTokens = tokens;
  }

  setToolTokenEstimate(tokens) {
    this.toolTokens = tokens;
  }

  addUserMessage(content) {
    this.messages.push({ role: 'user', content });
    this.estimateTokens();
    this.turnCount++;
  }

  addAssistantMessage(content) {
    this.messages.push({ role: 'assistant', content });
    this.estimateTokens();
  }

  addToolResult(toolUseId, content) {
    // Tool results go into user messages per Anthropic API format
    this.messages.push({
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      }],
    });
    this.estimateTokens();
  }

  /**
   * Get messages with incremental caching (BP3/BP4).
   * Places cache_control on the last assistant message so the API caches
   * all conversation history up to that point. On the next turn, only new
   * messages after the breakpoint are fresh tokens (~85% latency reduction).
   */
  getMessages() {
    if (this.messages.length < 2) return this.messages;

    // Find last assistant message to place cache breakpoint
    let lastAssistantIdx = -1;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'assistant') {
        lastAssistantIdx = i;
        break;
      }
    }

    // No assistant message yet (first turn), return as-is
    if (lastAssistantIdx === -1) return this.messages;

    // Return messages with cache_control on last assistant message's last content block
    return this.messages.map((msg, idx) => {
      if (idx !== lastAssistantIdx) return msg;
      return this._addCacheControl(msg);
    });
  }

  /** Add cache_control: ephemeral to the last content block of a message */
  _addCacheControl(msg) {
    const content = msg.content;
    if (typeof content === 'string') {
      return {
        ...msg,
        content: [{ type: 'text', text: content, cache_control: { type: 'ephemeral' } }],
      };
    }
    if (Array.isArray(content) && content.length > 0) {
      const lastIdx = content.length - 1;
      return {
        ...msg,
        content: content.map((block, i) =>
          i === lastIdx ? { ...block, cache_control: { type: 'ephemeral' } } : block
        ),
      };
    }
    return msg;
  }

  /** Update with real token counts from API response */
  updateFromUsage(usage) {
    if (!usage) return;
    this.hasRealUsage = true;
    this.lastInputTokens = usage.input_tokens || 0;
    this.lastOutputTokens = usage.output_tokens || 0;
    this.cacheCreation = usage.cache_creation_input_tokens || 0;
    this.cacheRead = usage.cache_read_input_tokens || 0;
    this.totalInputTokens += this.lastInputTokens;
    this.totalOutputTokens += this.lastOutputTokens;
    // Use real input tokens for context window tracking
    this.estimatedTokens = this.lastInputTokens + this.maxOutputTokens;
  }

  getUsage() {
    const base = {
      usedTokens: this.estimatedTokens,
      maxTokens: this.maxTokens,
      messageCount: this.messages.length,
      turnCount: this.turnCount,
    };
    if (this.hasRealUsage) {
      base.inputTokens = this.lastInputTokens;
      base.outputTokens = this.lastOutputTokens;
      base.cacheCreation = this.cacheCreation;
      base.cacheRead = this.cacheRead;
      base.totalInputTokens = this.totalInputTokens;
      base.totalOutputTokens = this.totalOutputTokens;
    }
    return base;
  }

  /** Rough token estimation (4 chars ≈ 1 token) */
  estimateTokens() {
    let total = this.systemTokens + this.toolTokens;
    for (const msg of this.messages) {
      if (typeof msg.content === 'string') {
        total += Math.ceil(msg.content.length / 4);
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text' || block.type === 'tool_result') {
            const text = block.text || block.content || '';
            total += Math.ceil(text.length / 4);
          }
        }
      }
    }
    total += this.maxOutputTokens; // Reserve for output
    this.estimatedTokens = total;
  }

  needsCompression() {
    return this.estimatedTokens / this.maxTokens > this.compressionThreshold;
  }

  /**
   * Smart compression: uses Haiku for fast summarization, preserves anchor turns
   * Anchor turns = messages containing: file edits, user decisions, error resolutions
   */
  async compress(client) {
    if (this.messages.length < 6) return false;

    const beforeTokens = this.estimatedTokens;
    const keepRecent = 6; // Keep last 6 messages intact (more than basic)
    const toCompress = this.messages.slice(0, -keepRecent);
    const recentMessages = this.messages.slice(-keepRecent);

    // Identify anchor turns (important messages to preserve verbatim)
    const anchors = [];
    const compressible = [];

    for (const msg of toCompress) {
      if (this._isAnchorTurn(msg)) {
        anchors.push(msg);
      } else {
        compressible.push(msg);
      }
    }

    // Build summary of compressible messages
    const summaryContent = compressible.map(m => {
      const role = m.role;
      const text = this._extractText(m);
      return `[${role}]: ${text.substring(0, 600)}`;
    }).join('\n---\n');

    if (!summaryContent.trim()) {
      // Only anchors, keep as-is but truncate tool results
      this.messages = [...this._truncateAnchors(anchors), ...recentMessages];
      this.estimateTokens();
      return true;
    }

    try {
      // Use Haiku for fast, cheap compression (~0.5s, ~$0.001)
      const compressionModel = 'claude-haiku-4-5-20251001';
      const response = await client.messages.create({
        model: compressionModel,
        max_tokens: 2000,
        system: `You are a conversation compressor for an AI coding assistant. Summarize the conversation preserving:
1. Current task and status (in progress / completed / blocked)
2. Key decisions made and their reasoning
3. File paths modified and what was changed
4. Unresolved errors or pending tasks
5. User preferences expressed during the conversation

Format as a structured summary with sections. Be concise but keep all actionable details.`,
        messages: [{ role: 'user', content: summaryContent }],
      });

      const summary = response.content[0]?.text || 'Summary unavailable';

      // Reconstruct: summary + preserved anchors + recent messages
      const newMessages = [
        { role: 'user', content: `<system-reminder>\n[Compressed conversation history — ${this.compressionCount + 1} compressions so far]\n${summary}\n</system-reminder>\nPlease continue from where we left off.` },
        { role: 'assistant', content: 'I have the context from the compressed history. Continuing.' },
      ];

      // Re-insert anchor turns (truncated)
      for (const anchor of this._truncateAnchors(anchors).slice(-4)) {
        newMessages.push(anchor);
      }

      this.messages = [...newMessages, ...recentMessages];
      this.estimateTokens();
      this.compressionCount++;
      this.totalTokensSaved += Math.max(0, beforeTokens - this.estimatedTokens);
      return true;
    } catch {
      // Fallback: simple truncation
      this.messages = [
        { role: 'user', content: '[Earlier conversation was truncated due to context limits]' },
        { role: 'assistant', content: 'Understood. I\'ll continue with the available context.' },
        ...recentMessages,
      ];
      this.estimateTokens();
      this.compressionCount++;
      return true;
    }
  }

  /** Check if a message is an "anchor turn" worth preserving */
  _isAnchorTurn(msg) {
    const text = this._extractText(msg);
    // User decisions (approval, rejection, explicit instructions)
    if (msg.role === 'user' && /\/(approve|cancel|yes|no)\b/i.test(text)) return true;
    // File edits (tool results from EditFile/WriteFile)
    if (text.includes('EditFile') || text.includes('WriteFile')) return true;
    // Error resolutions
    if (text.includes('Error:') && text.includes('fix')) return true;
    // Todo updates
    if (text.includes('TodoWrite') || text.includes('Todos updated')) return true;
    return false;
  }

  /** Extract text content from a message */
  _extractText(msg) {
    if (typeof msg.content === 'string') return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content.map(b => b.text || b.content || '').join('\n');
    }
    return '';
  }

  /** Truncate anchor turns to save space (keep key info, trim verbose tool results) */
  _truncateAnchors(anchors) {
    return anchors.map(msg => {
      if (typeof msg.content === 'string' && msg.content.length > 800) {
        return { ...msg, content: msg.content.substring(0, 800) + '\n[...truncated]' };
      }
      if (Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map(b => {
            if ((b.type === 'text' || b.type === 'tool_result') && (b.text || b.content || '').length > 500) {
              const field = b.text ? 'text' : 'content';
              return { ...b, [field]: (b[field] || '').substring(0, 500) + '\n[...truncated]' };
            }
            return b;
          }),
        };
      }
      return msg;
    });
  }

  getCompressionStats() {
    return {
      compressions: this.compressionCount,
      tokensSaved: this.totalTokensSaved,
    };
  }
}
