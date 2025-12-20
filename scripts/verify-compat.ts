import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const README_PATH = path.join(process.cwd(), 'README.md');
const PACKAGE_PATH = path.join(process.cwd(), 'package.json');
const CONDUCTOR_PATH = path.join(process.cwd(), 'vendor/conductor');

async function verify() {
  console.log('🔍 Verifying Compatibility Matrix...');

  // 1. Get current bridge version
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'));
  const version = pkg.version;

  // 2. Get current Conductor SHA
  let currentSha = '';
  try {
    currentSha = execSync('git rev-parse HEAD', { cwd: CONDUCTOR_PATH }).toString().trim().substring(0, 7);
  } catch (e) {
    console.error('❌ Error: Could not determine Conductor submodule SHA.');
    process.exit(1);
  }

  // 3. Check README
  const readme = fs.readFileSync(README_PATH, 'utf-8');
  
  // Look for the version in the matrix and its associated SHA
  // Example line: | **v1.1.2** | [b49d770](...) | ... |
  const versionRegex = new RegExp(`\\|\\s+\\*\\*v${version.replace(/\./g, '\\.')}\\*\\*\\s+\\|\\s+\\[([a-f0-9]+)\\]`, 'i');
  const match = readme.match(versionRegex);

  if (!match) {
    console.error(`❌ Error: Bridge version v${version} not found in README's Compatibility Matrix.`);
    console.log(`Please add a line for v${version} in the README matrix.`);
    process.exit(1);
  }

  const documentedSha = match[1].substring(0, 7);

  if (documentedSha !== currentSha) {
    console.error(`❌ Error: Compatibility Matrix mismatch!`);
    console.error(`   - Bridge version: v${version}`);
    console.error(`   - Documented Conductor SHA: ${documentedSha}`);
    console.error(`   - Actual Conductor SHA: ${currentSha}`);
    console.log(`Please update the README to match the actual submodule SHA.`);
    process.exit(1);
  }

  console.log(`✅ Success: v${version} is correctly documented with Conductor SHA ${currentSha}.`);
}

verify().catch(console.error);
