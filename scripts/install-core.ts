import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Core installation logic that can be shared between Bash and Node installers.
 * This script assumes it is being run from WITHIN the bridge repository.
 */
export async function runCoreInstallation(targetProject: string, ref: string = 'main') {
  const bridgeRoot = process.cwd();
  
  console.log(`     - Synchronizing with ref: ${ref}`);
  
  // 1. Ensure we are on the right ref and clean
  run('git am --abort || true', bridgeRoot);
  run('git merge --abort || true', bridgeRoot);
  run('git reset --hard HEAD', bridgeRoot);
  run('git clean -fd', bridgeRoot);
  
  run(`git fetch origin ${ref}`, bridgeRoot);
  run(`git checkout ${ref}`, bridgeRoot);
  
  // If it's a branch, we want to reset to origin/branch. If it's a tag/sha, just keep it.
  try {
    run(`git reset --hard origin/${ref}`, bridgeRoot);
  } catch (e) {
    run(`git reset --hard ${ref}`, bridgeRoot);
  }
  
  run('git clean -fd', bridgeRoot);
  run('git submodule update --init --recursive', bridgeRoot);

  // 2. Install dependencies
  console.log('     - Installing bridge dependencies...');
  run('npm install --quiet', bridgeRoot);

  // 3. Sync commands from Conductor
  console.log('     - Syncing Conductor commands...');
  run('npm run sync', bridgeRoot);

  // 4. Link to the target project
  console.log(`     - Linking to project: ${targetProject}`);
  // We use tsx to run the setup script
  run(`npx tsx scripts/setup-bridge.ts "${targetProject}"`, bridgeRoot);
}

function run(cmd: string, cwd: string) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (e) {
    throw new Error(`Failed to execute: ${cmd}`);
  }
}

// If run directly
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const target = process.argv[2] || process.cwd();
  const ref = process.env.BRIDGE_REF || 'main';
  runCoreInstallation(target, ref).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
