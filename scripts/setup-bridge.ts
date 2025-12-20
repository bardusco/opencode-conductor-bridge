import * as fs from 'fs';
import * as path from 'path';

export interface SetupConfig {
  bridgeRoot: string;
  vendorConductor: string;
  commandsDir: string;
  targetProject: string;
}

export function createDefaultConfig(
  bridgeRoot: string = process.cwd(),
  targetProject: string = process.argv[2] || process.cwd()
): SetupConfig {
  return {
    bridgeRoot,
    vendorConductor: path.join(bridgeRoot, 'vendor/conductor'),
    commandsDir: path.join(bridgeRoot, 'templates/opencode/command'),
    targetProject,
  };
}

export interface SetupResult {
  targetOpencodeDir: string;
  filesInstalled: string[];
  legacyDirMoved: boolean;
  legacyDirWarning: boolean;
}

export function handleLegacyDirectory(
  legacyDir: string,
  targetDir: string
): { moved: boolean; warning: boolean } {
  if (!fs.existsSync(legacyDir)) {
    return { moved: false, warning: false };
  }

  console.log(`Found legacy directory '${legacyDir}'.`);
  
  if (!fs.existsSync(targetDir)) {
    console.log(`     - Moving it to '${targetDir}'...`);
    fs.renameSync(legacyDir, targetDir);
    return { moved: true, warning: false };
  } else {
    console.log(`     - You should remove it to avoid typos: rm -rf ${legacyDir}`);
    return { moved: false, warning: true };
  }
}

export function processTemplateContent(
  content: string,
  vendorConductor: string,
  bridgeRoot: string
): string {
  return content
    .split('{{CONDUCTOR_ROOT}}').join(vendorConductor)
    .split('{{BRIDGE_ROOT}}').join(bridgeRoot);
}

export async function setup(config: SetupConfig): Promise<SetupResult> {
  const targetOpencodeDir = path.join(config.targetProject, '.opencode/command');
  const legacyOpencodeDir = path.join(config.targetProject, '.opencode/commands');

  const result: SetupResult = {
    targetOpencodeDir,
    filesInstalled: [],
    legacyDirMoved: false,
    legacyDirWarning: false,
  };

  // Handle legacy directory typo
  const legacyResult = handleLegacyDirectory(legacyOpencodeDir, targetOpencodeDir);
  result.legacyDirMoved = legacyResult.moved;
  result.legacyDirWarning = legacyResult.warning;

  if (!fs.existsSync(targetOpencodeDir)) {
    fs.mkdirSync(targetOpencodeDir, { recursive: true });
  }

  const files = fs.readdirSync(config.commandsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const src = path.join(config.commandsDir, file);
    const dest = path.join(targetOpencodeDir, file);
    
    let content = fs.readFileSync(src, 'utf-8');
    content = processTemplateContent(content, config.vendorConductor, config.bridgeRoot);
    
    fs.writeFileSync(dest, content);
    console.log(`Installed ${file} to ${targetOpencodeDir}`);
    result.filesInstalled.push(file);
  }

  return result;
}

// Main execution - only runs when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const config = createDefaultConfig();
  setup(config).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
