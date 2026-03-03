/**
 * CLI Interface - handles all terminal I/O, prompts, and display
 */
import readline from 'readline';
import chalk from 'chalk';

export class CLIInterface {
  constructor(config) {
    this.config = config;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  printBanner() {
    console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════╗
║          VL-Code v0.4.0                  ║
║   AI Programming IDE for VL Language     ║
╚══════════════════════════════════════════╝`));
    console.log(chalk.dim(`  Model: ${this.config.model}`));
    console.log(chalk.dim(`  Work Dir: ${this.config.workDir}`));
    console.log(chalk.dim(`  Type /help for commands, /quit to exit\n`));
  }

  printProjectInfo(summary) {
    if (!summary) return;
    console.log(chalk.green('  VL Project detected:'));
    console.log(chalk.dim(`    Files: ${summary.totalFiles} (${summary.breakdown})`));
    if (summary.vlVersion) {
      console.log(chalk.dim(`    VL Version: ${summary.vlVersion}`));
    }
    console.log('');
  }

  printHelp() {
    console.log(chalk.bold('\nCommands:'));
    console.log('  /help      Show this help');
    console.log('  /status    Full status (context + symbols + cache)');
    console.log('  /files     Project file tree');
    console.log('  /graph     Dependency graph');
    console.log('  /symbols   Symbol index statistics');
    console.log('  /scan      Full project scan (impact analysis)');
    console.log('  /validate  Validate all VL files');
    console.log('  /fix       Auto-fix VL syntax issues');
    console.log('  /plan      Enter plan mode');
    console.log('  /workflow  Run VL workflow');
    console.log('  /quit      Exit VL-Code');
    console.log('');
    console.log(chalk.dim('  Start with --web flag for browser-based IDE'));
    console.log('');
  }

  printStatus(usage) {
    const pct = Math.round(usage.usedTokens / usage.maxTokens * 100);
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    console.log(chalk.bold('\nContext Window:'));
    console.log(`  [${bar}] ${pct}% (${usage.usedTokens}/${usage.maxTokens})`);
    console.log(chalk.dim(`  Messages: ${usage.messageCount}, Turns: ${usage.turnCount}`));
    console.log('');
  }

  printFiles(tree) {
    console.log(chalk.bold('\nProject Files:'));
    for (const [category, files] of Object.entries(tree)) {
      console.log(chalk.cyan(`  ${category}/`));
      for (const f of files) {
        console.log(chalk.dim(`    ${f}`));
      }
    }
    console.log('');
  }

  printError(msg) {
    console.log(chalk.red(`\n  Error: ${msg}\n`));
  }

  print(text) {
    console.log(text);
  }

  printAssistant(text) {
    console.log(chalk.white(text));
  }

  printToolCall(name, description) {
    console.log(chalk.dim(`  ▶ ${name}: ${description}`));
  }

  printToolResult(name, preview) {
    console.log(chalk.dim(`  ◀ ${name}: ${preview}`));
  }

  printTodo(todos) {
    if (!todos || todos.length === 0) return;
    console.log(chalk.bold('\n  Tasks:'));
    for (const t of todos) {
      const icon = t.status === 'completed' ? chalk.green('✓') :
                   t.status === 'in_progress' ? chalk.yellow('→') : chalk.dim('○');
      const text = t.status === 'in_progress' ? chalk.yellow(t.activeForm) :
                   t.status === 'completed' ? chalk.dim(t.content) : t.content;
      console.log(`    ${icon} ${text}`);
    }
    console.log('');
  }

  printStreaming(token) {
    process.stdout.write(token);
  }

  endStreaming() {
    console.log('');
  }

  prompt() {
    return new Promise(resolve => {
      this.rl.question(chalk.bold.cyan('\n> '), answer => {
        resolve(answer);
      });
    });
  }

  close() {
    this.rl.close();
  }
}
