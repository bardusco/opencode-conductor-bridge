import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';

const CONDUCTOR_SOURCE = path.join(process.cwd(), 'vendor/conductor');
const COMMANDS_SOURCE = path.join(CONDUCTOR_SOURCE, 'commands/conductor');
const OUTPUT_DIR = path.join(process.cwd(), 'templates/opencode/command');

async function sync() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(COMMANDS_SOURCE).filter(f => f.endsWith('.toml'));

  for (const file of files) {
    const filePath = path.join(COMMANDS_SOURCE, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = toml.parse(content);

    const commandName = path.basename(file, '.toml');
    const description = parsed.description || '';
    let prompt = parsed.prompt || '';

    // Replace Conductor internal paths with project-relative paths
    // Gemini uses ~/.gemini/extensions/conductor/
    // We want to map this to our vendor/conductor/ directory
    const conductorExtensionPath = '~/.gemini/extensions/conductor';
    const placeholder = '{{CONDUCTOR_ROOT}}';
    
    prompt = prompt.split(conductorExtensionPath).join(placeholder);

    const mdContent = `---
description: ${description}
---

# Conductor Bridge: ${commandName}

> [!NOTE]
> This command is bridged from Gemini Conductor.
> Original Source: [${file}](https://github.com/gemini-cli-extensions/conductor/blob/main/commands/conductor/${file})

${prompt}
`;

    const outPath = path.join(OUTPUT_DIR, `conductor.${commandName}.md`);
    fs.writeFileSync(outPath, mdContent);
    console.log(`Generated ${outPath}`);
  }
}

sync().catch(console.error);
