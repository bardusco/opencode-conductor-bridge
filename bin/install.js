#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const REPO_URL = 'https://github.com/bardusco/opencode-conductor-bridge.git';

export function getInstallDir() {
  return path.join(os.homedir(), '.opencode', 'conductor-bridge');
}

export function getTargetProject() {
  return process.cwd();
}

export function run(cmd, cwd = process.cwd()) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error(`Error executing: ${cmd}`);
    return false;
  }
}

export function runSilent(cmd, cwd = process.cwd()) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

export function checkGitAvailable() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

export function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

export function getLatestStableTag(repoUrl) {
  try {
    const output = execSync(`git ls-remote --tags --sort="v:refname" ${repoUrl}`).toString().trim();
    const stableTags = output.split('\n')
      .filter(line => /refs\/tags\/v\d+\.\d+\.\d+$/.test(line))
      .map(line => line.split('/').pop());
    
    if (stableTags.length > 0) {
      return stableTags[stableTags.length - 1];
    }
  } catch (e) {
    // Fall through to return null
  }
  return null;
}

export function getDesiredRef(repoUrl, envRef = process.env.BRIDGE_REF) {
  if (envRef) {
    return envRef;
  }
  return getLatestStableTag(repoUrl) || 'main';
}

export async function install(config = {}) {
  const {
    repoUrl = REPO_URL,
    installDir = getInstallDir(),
    targetProject = getTargetProject(),
    bridgeRef = process.env.BRIDGE_REF,
  } = config;

  console.log('Installing OpenCode Conductor Bridge (Node.js Installer)...');

  // 0. Check for Git
  if (!checkGitAvailable()) {
    console.error('Error: \'git\' command not found. This bridge requires git to function.');
    console.error('Please install git (https://git-scm.com/) and try again.');
    return { success: false, error: 'git not found' };
  }

  // 1. Ensure base directory exists
  const opencodeBase = path.dirname(installDir);
  ensureDirectoryExists(opencodeBase);

  // 2. Clone if not exists
  if (!fs.existsSync(installDir)) {
    console.log(`     - Cloning bridge into ${installDir}...`);
    if (!run(`git clone --recursive ${repoUrl} "${installDir}"`)) {
      return { success: false, error: 'clone failed' };
    }
  }

  // 3. Get desired ref (latest stable tag or BRIDGE_REF)
  const ref = getDesiredRef(repoUrl, bridgeRef);
  console.log(`     - Synchronizing to ${ref}...`);

  // 4. Fetch and checkout the desired ref BEFORE running any scripts
  runSilent('git am --abort', installDir);
  runSilent('git merge --abort', installDir);
  
  if (!run('git fetch origin --tags --force', installDir)) {
    return { success: false, error: 'fetch failed' };
  }
  if (!run('git reset --hard HEAD', installDir)) {
    return { success: false, error: 'reset failed' };
  }
  if (!run('git clean -fd', installDir)) {
    return { success: false, error: 'clean failed' };
  }
  if (!run(`git checkout ${ref}`, installDir)) {
    return { success: false, error: 'checkout failed' };
  }
  
  // If it's a branch, reset to origin/branch. If it's a tag/sha, this will fail silently.
  if (!runSilent(`git reset --hard origin/${ref}`, installDir)) {
    if (!run(`git reset --hard ${ref}`, installDir)) {
      return { success: false, error: 'reset to ref failed' };
    }
  }
  
  if (!run('git clean -fd', installDir)) {
    return { success: false, error: 'final clean failed' };
  }
  if (!run('git submodule update --init --recursive', installDir)) {
    return { success: false, error: 'submodule update failed' };
  }

  // 5. Install dependencies
  console.log('     - Installing dependencies...');
  if (!run('npm install --quiet', installDir)) {
    return { success: false, error: 'npm install failed' };
  }

  // 6. Sync commands from Conductor
  console.log('     - Syncing Conductor commands...');
  if (!run('npm run sync', installDir)) {
    return { success: false, error: 'sync failed' };
  }

  // 7. Link to the target project
  console.log(`     - Linking to project: ${targetProject}`);
  if (!run(`npx tsx scripts/setup-bridge.ts "${targetProject}"`, installDir)) {
    return { success: false, error: 'setup-bridge failed' };
  }

  console.log('\nReady! The /conductor.* commands are now available.');
  return { success: true, ref, installDir, targetProject };
}

// Main execution - only runs when script is executed directly
// Use realpathSync to resolve symlinks (e.g., /tmp -> /private/tmp on macOS)
// because import.meta.url resolves symlinks but process.argv[1] doesn't
const isMainModule = import.meta.url === `file://${fs.realpathSync(process.argv[1])}`;
if (isMainModule) {
  install().then((result) => {
    if (!result.success) {
      process.exit(1);
    }
  }).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
