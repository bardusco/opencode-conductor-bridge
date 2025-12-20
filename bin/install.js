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

function runSilent(cmd, cwd = process.cwd()) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
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

  // 2. Clone if not exists
  if (!fs.existsSync(INSTALL_DIR)) {
    console.log(`     - Cloning bridge into ${INSTALL_DIR}...`);
    run(`git clone --recursive ${REPO_URL} "${INSTALL_DIR}"`);
  }

  // 3. Get desired ref (latest stable tag or BRIDGE_REF)
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

  console.log(`     - Synchronizing to ${ref}...`);

  // 4. Fetch and checkout the desired ref BEFORE running any scripts
  //    This is critical: the installed version may be old and missing scripts
  runSilent('git am --abort', INSTALL_DIR);
  runSilent('git merge --abort', INSTALL_DIR);
  run('git fetch origin --tags --force', INSTALL_DIR);
  run('git reset --hard HEAD', INSTALL_DIR);
  run('git clean -fd', INSTALL_DIR);
  run(`git checkout ${ref}`, INSTALL_DIR);
  
  // If it's a branch, reset to origin/branch. If it's a tag/sha, this will fail silently.
  runSilent(`git reset --hard origin/${ref}`, INSTALL_DIR) || 
    run(`git reset --hard ${ref}`, INSTALL_DIR);
  
  run('git clean -fd', INSTALL_DIR);
  run('git submodule update --init --recursive', INSTALL_DIR);

  // 5. Install dependencies
  console.log('     - Installing dependencies...');
  run('npm install --quiet', INSTALL_DIR);

  // 6. Sync commands from Conductor
  console.log('     - Syncing Conductor commands...');
  run('npm run sync', INSTALL_DIR);

  // 7. Link to the target project
  console.log(`     - Linking to project: ${TARGET_PROJECT}`);
  run(`npx tsx scripts/setup-bridge.ts "${TARGET_PROJECT}"`, INSTALL_DIR);

  console.log('\n✅ Ready! The /conductor.* commands are now available.');
}

install().catch(console.error);
