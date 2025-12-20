import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { execSync } from 'child_process';

const CONDUCTOR_SOURCE = path.join(process.cwd(), 'vendor/conductor');
const COMMANDS_SOURCE = path.join(CONDUCTOR_SOURCE, 'commands/conductor');
const TEMPLATES_SOURCE = path.join(CONDUCTOR_SOURCE, 'templates/code_styleguides');
const OUTPUT_DIR = path.join(process.cwd(), 'templates/opencode/command');

function getSubmoduleSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: CONDUCTOR_SOURCE }).toString().trim();
  } catch (e) {
    return 'main';
  }
}

async function sync() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sha = getSubmoduleSha();
  
  // Sync TOML Commands
  const commandFiles = fs.readdirSync(COMMANDS_SOURCE).filter(f => f.endsWith('.toml'));
  console.log(`Syncing commands from Conductor @ ${sha.substring(0, 7)}...`);

  for (const file of commandFiles) {
    const filePath = path.join(COMMANDS_SOURCE, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = toml.parse(content);

    const commandName = path.basename(file, '.toml');
    const description = parsed.description || '';
    let prompt = parsed.prompt || '';

    const conductorExtensionPath = '~/.gemini/extensions/conductor';
    const placeholder = '{{CONDUCTOR_ROOT}}';
    
    prompt = prompt.split(conductorExtensionPath).join(placeholder);

    const mdContent = `---
description: ${description}
---

# Conductor Bridge: ${commandName}

> [!NOTE]
> This command is bridged from Gemini Conductor.
> **Bridge Version:** 1.1.0
> **Conductor Source:** [${file}](https://github.com/gemini-cli-extensions/conductor/blob/${sha}/commands/conductor/${file})
> **Local Reference:** \`{{CONDUCTOR_ROOT}}/commands/conductor/${file}\`

${prompt}

<!-- conductor-bridge-metadata:
  origin_file: ${file}
  origin_sha: ${sha}
  generated_at: ${new Date().toISOString()}
-->
`;

    const outPath = path.join(OUTPUT_DIR, `conductor.${commandName}.md`);
    fs.writeFileSync(outPath, mdContent);
    console.log(`  ✓ Generated conductor.${commandName}.md`);
  }

  // Sync Styleguides
  if (fs.existsSync(TEMPLATES_SOURCE)) {
    const styleguideFiles = fs.readdirSync(TEMPLATES_SOURCE).filter(f => f.endsWith('.md'));
    console.log(`Syncing styleguides...`);
    
    for (const file of styleguideFiles) {
      const filePath = path.join(TEMPLATES_SOURCE, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const styleguideName = path.basename(file, '.md');

      const mdContent = `---
description: Conductor Styleguide for ${styleguideName}
---

# Conductor Styleguide: ${styleguideName}

> [!NOTE]
> This styleguide is bridged from Gemini Conductor.
> **Conductor Source:** [${file}](https://github.com/gemini-cli-extensions/conductor/blob/${sha}/templates/code_styleguides/${file})

${content}

<!-- conductor-bridge-metadata:
  origin_file: ${file}
  origin_sha: ${sha}
  generated_at: ${new Date().toISOString()}
-->
`;

      const outPath = path.join(OUTPUT_DIR, `conductor.styleguide.${styleguideName}.md`);
      fs.writeFileSync(outPath, mdContent);
      console.log(`  ✓ Generated conductor.styleguide.${styleguideName}.md`);
    }
  }
}

sync().catch(console.error);
