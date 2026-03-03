/**
 * File Watcher – watches VL project files for changes
 * Auto-validates on save, notifies browser UI via SSE
 */
import chokidar from 'chokidar';
import path from 'path';

const VL_EXTS = ['.vx', '.sc', '.cp', '.vs', '.vdb', '.vth'];

export class FileWatcher {
  constructor(workDir, callbacks = {}) {
    this.workDir = workDir;
    this.callbacks = callbacks;
    this.watcher = null;
  }

  start() {
    const patterns = VL_EXTS.map(ext => path.join(this.workDir, '**', `*${ext}`));

    this.watcher = chokidar.watch(patterns, {
      ignoreInitial: true,
      persistent: true,
      ignorePermissionErrors: true,
    });

    this.watcher
      .on('change', (filePath) => {
        const rel = path.relative(this.workDir, filePath);
        this.callbacks.onChange?.(rel, 'modified');
      })
      .on('add', (filePath) => {
        const rel = path.relative(this.workDir, filePath);
        this.callbacks.onChange?.(rel, 'created');
      })
      .on('unlink', (filePath) => {
        const rel = path.relative(this.workDir, filePath);
        this.callbacks.onChange?.(rel, 'deleted');
      });
  }

  stop() {
    this.watcher?.close();
  }
}
