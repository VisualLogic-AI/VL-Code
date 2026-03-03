#!/usr/bin/env node
import { VLCode } from '../src/index.js';

const app = new VLCode();
app.run(process.argv.slice(2)).catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
