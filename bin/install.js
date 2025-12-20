#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const REPO_URL = 'https://github.com/bardusco/opencode-conductor-bridge.git';
const INSTALL_DIR = path.join(os.homedir(), '.opencode', 'conductor-bridge');
const TARGET_PROJECT = process.cwd();

function run(cmd, cwd = process.cwd()) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (e) {
    console.error(`Error executing: ${cmd}`);
    process.exit(1);
  }
}

async function install() {
  console.log('🚀 Installing OpenCode Conductor Bridge (Node.js Installer)...');

  // 0. Check for Git
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Error: \'git\' command not found. This bridge requires git to function.');
    console.error('Please install git (https://git-scm.com/) and try again.');
    process.exit(1);
  }

  // 1. Ensure base directory exists
  const opencodeBase = path.join(os.homedir(), '.opencode');
  if (!fs.existsSync(opencodeBase)) {
    fs.mkdirSync(opencodeBase, { recursive: true });
  }

  // 2. Clone or Update
  if (!fs.existsSync(INSTALL_DIR)) {
    console.log(`     - Cloning bridge into ${INSTALL_DIR}...`);
    run(`git clone --recursive ${REPO_URL} "${INSTALL_DIR}"`);
  }

  // Get desired ref
  let ref = process.env.BRIDGE_REF;
  if (!ref) {
    try {
      const output = execSync(`git ls-remote --tags --sort="v:refname" ${REPO_URL}`).toString().trim();
      const stableTags = output.split('\n')
        .filter(line => /refs\/tags\/v\d+\.\d+\.\d+$/.test(line))
        .map(line => line.split('/').pop());
      
      if (stableTags.length > 0) {
        ref = stableTags[stableTags.length - 1];
      }
    } catch (e) {
      ref = 'main';
    }
  }
  ref = ref || 'main';

  // 3. Hand over to install-core.ts
  // We use npx tsx to run the core script from the installation directory
  process.env.BRIDGE_REF = ref;
  run(`npx tsx scripts/install-core.ts "${TARGET_PROJECT}"`, INSTALL_DIR);

  console.log('\n✅ Ready! The /conductor.* commands are now available.');
}

install().catch(console.error);
