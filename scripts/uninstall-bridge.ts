import * as fs from 'fs';
import * as path from 'path';

export interface UninstallConfig {
  targetProject: string;
}

export function createDefaultConfig(
  targetProject: string = process.argv[2] || process.cwd()
): UninstallConfig {
  return {
    targetProject,
  };
}

export interface RemoveResult {
  filesRemoved: string[];
  directoryExists: boolean;
}

export function removeConductorFiles(dir: string): RemoveResult {
  const result: RemoveResult = {
    filesRemoved: [],
    directoryExists: fs.existsSync(dir),
  };

  if (!result.directoryExists) {
    return result;
  }

  const files = fs.readdirSync(dir).filter(f => f.startsWith('conductor.'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    fs.unlinkSync(filePath);
    console.log(`Removed ${file} from ${dir}`);
    result.filesRemoved.push(file);
  }

  return result;
}

export interface UninstallResult {
  targetOpencodeDir: string;
  legacyOpencodeDir: string;
  conductorStateDir: string;
  targetFilesRemoved: string[];
  legacyFilesRemoved: string[];
  conductorStateDirExists: boolean;
}

export async function uninstall(config: UninstallConfig): Promise<UninstallResult> {
  const targetOpencodeDir = path.join(config.targetProject, '.opencode/command');
  const legacyOpencodeDir = path.join(config.targetProject, '.opencode/commands');
  const conductorStateDir = path.join(config.targetProject, 'conductor');

  const targetResult = removeConductorFiles(targetOpencodeDir);
  const legacyResult = removeConductorFiles(legacyOpencodeDir);

  const conductorStateDirExists = fs.existsSync(conductorStateDir);
  if (conductorStateDirExists) {
    console.log(`\nNote: The conductor state directory at '${conductorStateDir}' still exists.`);
    console.log(`If you want to remove it, please run: rm -rf ${conductorStateDir}`);
  }

  console.log('\nUninstall complete.');

  return {
    targetOpencodeDir,
    legacyOpencodeDir,
    conductorStateDir,
    targetFilesRemoved: targetResult.filesRemoved,
    legacyFilesRemoved: legacyResult.filesRemoved,
    conductorStateDirExists,
  };
}

// Main execution - only runs when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const config = createDefaultConfig();
  uninstall(config).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
