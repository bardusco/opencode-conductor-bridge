import * as fs from 'fs';
import * as path from 'path';

async function uninstall() {
  const targetProject = process.argv[2] || process.cwd();
  const targetOpencodeDir = path.join(targetProject, '.opencode/command');
  const legacyOpencodeDir = path.join(targetProject, '.opencode/commands');
  const conductorStateDir = path.join(targetProject, 'conductor');

  const removeConductorFiles = (dir: string) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.startsWith('conductor.'));
      for (const file of files) {
        const filePath = path.join(dir, file);
        fs.unlinkSync(filePath);
        console.log(`Removed ${file} from ${dir}`);
      }
      // If the directory is now empty (except for potentially other files), we don't remove the dir itself
      // because it's an opencode standard directory.
    }
  };

  removeConductorFiles(targetOpencodeDir);
  removeConductorFiles(legacyOpencodeDir);

  // Ask about conductor state directory if it exists
  if (fs.existsSync(conductorStateDir)) {
      console.log(`\nNote: The conductor state directory at '${conductorStateDir}' still exists.`);
      console.log(`If you want to remove it, please run: rm -rf ${conductorStateDir}`);
  }

  console.log('\n✅ Uninstall complete.');
}

uninstall().catch(console.error);
