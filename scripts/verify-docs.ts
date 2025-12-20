import * as fs from 'fs';
import * as path from 'path';

/**
 * Verifies that README version references match package.json version.
 * Fails CI if there's drift between docs and actual version.
 */

const ROOT = process.cwd();
const pkgPath = path.join(ROOT, 'package.json');
const readmePath = path.join(ROOT, 'README.md');

function getPackageVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (!pkg.version) {
    console.error('ERROR: package.json missing "version" field');
    process.exit(1);
  }
  return pkg.version;
}

function verifyReadme(version: string): boolean {
  const readme = fs.readFileSync(readmePath, 'utf-8');
  const errors: string[] = [];

  // Check title version
  const titleMatch = readme.match(/^# OpenCode Conductor Bridge \(v([\d.]+)\)/m);
  if (!titleMatch) {
    errors.push('README title missing version');
  } else if (titleMatch[1] !== version) {
    errors.push(`README title has v${titleMatch[1]}, expected v${version}`);
  }

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
    console.error('❌ README version drift detected:');
    errors.forEach(e => console.error(`   - ${e}`));
    return false;
  }

  return true;
}

function verifyTemplates(version: string): boolean {
  const templatesDir = path.join(ROOT, 'templates/opencode/command');
  if (!fs.existsSync(templatesDir)) {
    console.error('ERROR: templates directory not found');
    return false;
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
  const errors: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
    const versionMatch = content.match(/\*\*Bridge Version:\*\* ([\d.]+)/);
    
    if (versionMatch && versionMatch[1] !== version) {
      errors.push(`${file} has Bridge Version ${versionMatch[1]}, expected ${version}`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Template version drift detected:');
    errors.forEach(e => console.error(`   - ${e}`));
    return false;
  }

  return true;
}

// Main
console.log('🔍 Verifying documentation version consistency...');

const version = getPackageVersion();
console.log(`   Package version: ${version}`);

const readmeOk = verifyReadme(version);
const templatesOk = verifyTemplates(version);

if (readmeOk && templatesOk) {
  console.log(`✅ All documentation matches v${version}`);
  process.exit(0);
} else {
  console.error('\n💡 Run "npm run sync" and update README version references.');
  process.exit(1);
}
