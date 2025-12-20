import * as fs from 'fs';
import * as path from 'path';

const BRIDGE_ROOT = process.cwd();
const VENDOR_CONDUCTOR = path.join(BRIDGE_ROOT, 'vendor/conductor');

async function setup() {
  const targetProject = process.argv[2] || process.cwd();
  const targetOpencodeDir = path.join(targetProject, '.opencode/command');
  const legacyOpencodeDir = path.join(targetProject, '.opencode/commands');

  // Handle legacy directory typo
  if (fs.existsSync(legacyOpencodeDir)) {
    console.log(`⚠️  Found legacy directory '${legacyOpencodeDir}'.`);
    if (!fs.existsSync(targetOpencodeDir)) {
      console.log(`     - Moving it to '${targetOpencodeDir}'...`);
      fs.renameSync(legacyOpencodeDir, targetOpencodeDir);
    } else {
      console.log(`     - You should remove it to avoid typos: rm -rf ${legacyOpencodeDir}`);
    }
  }

  if (!fs.existsSync(targetOpencodeDir)) {
    fs.mkdirSync(targetOpencodeDir, { recursive: true });
  }

  const commandsDir = path.join(BRIDGE_ROOT, 'templates/opencode/command');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const src = path.join(commandsDir, file);
    const dest = path.join(targetOpencodeDir, file);
    
    // We'll create a symlink or just copy. Copying is safer for cross-platform.
    // But we need to fix the paths in the copy to point back to the BRIDGE_ROOT.
    let content = fs.readFileSync(src, 'utf-8');
    
    // Replace the placeholder with the absolute path to THIS bridge's vendor
    content = content.split('{{CONDUCTOR_ROOT}}').join(VENDOR_CONDUCTOR);
    content = content.split('{{BRIDGE_ROOT}}').join(BRIDGE_ROOT);
    
    fs.writeFileSync(dest, content);
    console.log(`Installed ${file} to ${targetOpencodeDir}`);
  }
}

setup().catch(console.error);
