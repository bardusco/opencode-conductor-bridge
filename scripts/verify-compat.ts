import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface VerifyCompatConfig {
  readmePath: string;
  packagePath: string;
  conductorPath: string;
}

export function createDefaultConfig(cwd: string = process.cwd()): VerifyCompatConfig {
  return {
    readmePath: path.join(cwd, 'README.md'),
    packagePath: path.join(cwd, 'package.json'),
    conductorPath: path.join(cwd, 'vendor/conductor'),
  };
}

export function getPackageVersion(packagePath: string): string {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return pkg.version;
}

export function getConductorSha(conductorPath: string): string {
  return execSync('git rev-parse HEAD', { cwd: conductorPath }).toString().trim().substring(0, 7);
}

export function extractDocumentedSha(readme: string, version: string): string | null {
  // Look for the version in the matrix and its associated SHA
  // Example line: | **v1.1.2** | [b49d770](...) | ... |
  const versionRegex = new RegExp(`\\|\\s+\\*\\*v${version.replace(/\./g, '\\.')}\\*\\*\\s+\\|\\s+\\[([a-f0-9]+)\\]`, 'i');
  const match = readme.match(versionRegex);
  
  if (!match) {
    return null;
  }
  
  return match[1].substring(0, 7);
}

export interface VerifyResult {
  success: boolean;
  version: string;
  currentSha: string;
  documentedSha: string | null;
  error?: string;
}

export async function verify(config: VerifyCompatConfig): Promise<VerifyResult> {
  console.log('Verifying Compatibility Matrix...');

  // 1. Get current bridge version
  const version = getPackageVersion(config.packagePath);

  // 2. Get current Conductor SHA
  let currentSha: string;
  try {
    currentSha = getConductorSha(config.conductorPath);
  } catch (e) {
    return {
      success: false,
      version,
      currentSha: '',
      documentedSha: null,
      error: 'Could not determine Conductor submodule SHA.',
    };
  }

  // 3. Check README
  const readme = fs.readFileSync(config.readmePath, 'utf-8');
  const documentedSha = extractDocumentedSha(readme, version);

  if (!documentedSha) {
    return {
      success: false,
      version,
      currentSha,
      documentedSha: null,
      error: `Bridge version v${version} not found in README's Compatibility Matrix.`,
    };
  }

  if (documentedSha !== currentSha) {
    return {
      success: false,
      version,
      currentSha,
      documentedSha,
      error: `Compatibility Matrix mismatch! Documented: ${documentedSha}, Actual: ${currentSha}`,
    };
  }

  console.log(`Success: v${version} is correctly documented with Conductor SHA ${currentSha}.`);
  
  return {
    success: true,
    version,
    currentSha,
    documentedSha,
  };
}

// Main execution - only runs when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const config = createDefaultConfig();
  verify(config).then((result) => {
    if (!result.success) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  }).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
