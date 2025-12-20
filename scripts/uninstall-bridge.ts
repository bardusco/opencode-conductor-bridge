import * as fs from 'fs';
import * as path from 'path';

async function uninstall() {
  const targetProject = process.argv[2] || process.cwd();
  const targetOpencodeDir = path.join(targetProject, '.opencode/command');
  const conductorStateDir = path.join(targetProject, 'conductor');

  if (!fs.existsSync(targetOpencodeDir)) {
    console.log(`Directory ${targetOpencodeDir} does not exist. Nothing to uninstall.`);
    return;
  }

  const files = fs.readdirSync(targetOpencodeDir).filter(f => f.startsWith('conductor.'));

  if (files.length === 0) {
    console.log(`No conductor bridge commands found in ${targetOpencodeDir}.`);
  } else {
    for (const file of files) {
      const filePath = path.join(targetOpencodeDir, file);
      fs.unlinkSync(filePath);
      console.log(`Removed ${file} from ${targetOpencodeDir}`);
    }
  }

  // Ask about conductor state directory if it exists
  if (fs.existsSync(conductorStateDir)) {
      console.log(`\nNote: The conductor state directory at '${conductorStateDir}' still exists.`);
      console.log(`If you want to remove it, please run: rm -rf ${conductorStateDir}`);
  }

  console.log('\n✅ Uninstall complete.');
}

uninstall().catch(console.error);
