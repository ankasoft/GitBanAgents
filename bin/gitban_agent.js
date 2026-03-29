#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function openBrowser(url) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  execSync(`${cmd} ${url}`, { stdio: 'ignore' });
}

async function main() {
  console.log('🚀 Starting GitBan Agent...');

  const serverUrl = 'http://localhost:5173';

  console.log(`📂 Project root: ${projectRoot}`);
  console.log(`🌐 Opening browser at ${serverUrl}...`);

  openBrowser(serverUrl);

  console.log('✅ GitBan Agent is running!');
  console.log('   Press Ctrl+C to stop');
}

main().catch(err => {
  console.error('❌ Error starting GitBan Agent:', err.message);
  process.exit(1);
});
