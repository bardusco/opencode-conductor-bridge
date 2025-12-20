import * as fs from 'fs';
import * as path from 'path';

/**
 * Verifies that README version references match package.json version.
 * Fails CI if there's drift between docs and actual version.
 */

export interface VerifyDocsConfig {
  root: string;
  packagePath: string;
  readmePath: string;
  templatesDir: string;
}

export function createDefaultConfig(root: string = process.cwd()): VerifyDocsConfig {
  return {
    root,
    packagePath: path.join(root, 'package.json'),
    readmePath: path.join(root, 'README.md'),
    templatesDir: path.join(root, 'templates/opencode/command'),
  };
}

export function getPackageVersion(packagePath: string): string {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  if (!pkg.version) {
    throw new Error('package.json missing "version" field');
  }
  return pkg.version;
}

export interface ReadmeVerifyResult {
  valid: boolean;
  errors: string[];
}

export function verifyReadme(readmePath: string, version: string): ReadmeVerifyResult {
  const readme = fs.readFileSync(readmePath, 'utf-8');
  const errors: string[] = [];

  // Note: Title no longer contains version - version badge handles this dynamically

  // Check BRIDGE_REF examples (should reference current version)
  const bridgeRefPattern = /BRIDGE_REF[=:]"?v([\d.]+)"?/g;
  let match;
  while ((match = bridgeRefPattern.exec(readme)) !== null) {
    if (match[1] !== version) {
      errors.push(`BRIDGE_REF example has v${match[1]}, expected v${version}`);
    }
  }

  // Check git checkout example
  const checkoutMatch = readme.match(/git checkout v([\d.]+)/);
  if (checkoutMatch && checkoutMatch[1] !== version) {
    errors.push(`git checkout example has v${checkoutMatch[1]}, expected v${version}`);
  }

  // Check compatibility matrix (first row should be current version and bold)
  const matrixMatch = readme.match(/\| \*\*v([\d.]+)\*\* \|/);
  if (!matrixMatch) {
    errors.push('Compatibility matrix missing current version (bold)');
  } else if (matrixMatch[1] !== version) {
    errors.push(`Compatibility matrix shows v${matrixMatch[1]} as current, expected v${version}`);
  }

  // Check "latest stable tag" example
  const stableTagMatch = readme.match(/latest stable tag \(e\.g\., `v([\d.]+)`\)/);
  if (stableTagMatch && stableTagMatch[1] !== version) {
    errors.push(`"latest stable tag" example has v${stableTagMatch[1]}, expected v${version}`);
  }

  if (errors.length > 0) {
    console.error('README version drift detected:');
    errors.forEach(e => console.error(`   - ${e}`));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface TemplatesVerifyResult {
  valid: boolean;
  errors: string[];
}

export function verifyTemplates(templatesDir: string, version: string): TemplatesVerifyResult {
  const errors: string[] = [];

  if (!fs.existsSync(templatesDir)) {
    return {
      valid: false,
      errors: ['templates directory not found'],
    };
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
    const versionMatch = content.match(/\*\*Bridge Version:\*\* ([\d.]+)/);
    
    if (versionMatch && versionMatch[1] !== version) {
      errors.push(`${file} has Bridge Version ${versionMatch[1]}, expected ${version}`);
    }
  }

  if (errors.length > 0) {
    console.error('Template version drift detected:');
    errors.forEach(e => console.error(`   - ${e}`));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface VerifyDocsResult {
  success: boolean;
  version: string;
  readmeResult: ReadmeVerifyResult;
  templatesResult: TemplatesVerifyResult;
}

export async function verifyDocs(config: VerifyDocsConfig): Promise<VerifyDocsResult> {
  console.log('Verifying documentation version consistency...');

  const version = getPackageVersion(config.packagePath);
  console.log(`   Package version: ${version}`);

  const readmeResult = verifyReadme(config.readmePath, version);
  const templatesResult = verifyTemplates(config.templatesDir, version);

  const success = readmeResult.valid && templatesResult.valid;

  if (success) {
    console.log(`All documentation matches v${version}`);
  } else {
    console.error('\nRun "npm run sync" and update README version references.');
  }

  return {
    success,
    version,
    readmeResult,
    templatesResult,
  };
}

// Main execution - only runs when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const config = createDefaultConfig();
  verifyDocs(config).then((result) => {
    process.exit(result.success ? 0 : 1);
  }).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
