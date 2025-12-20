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

  // Sync Styleguides (Aggregated into a single command)
  if (fs.existsSync(TEMPLATES_SOURCE)) {
    const styleguideFiles = fs.readdirSync(TEMPLATES_SOURCE).filter(f => f.endsWith('.md'));
    const languages = styleguideFiles.map(f => path.basename(f, '.md')).sort();
    
    console.log(`Syncing styleguides (aggregated)...`);
    
    const mdContent = `---
description: Access language-specific code styleguides bridged from Conductor
---

# Conductor Styleguide

This command provides access to the official code styleguides from Gemini Conductor.

### Available Styleguides
${languages.map(lang => `- ${lang}`).join('\n')}

### Instructions
1. **Identify Language:** Determine which language the user is interested in (e.g., from the command arguments or context).
2. **Fetch Rules:** Read the specific styleguide rules from the following path:
   - \`{{CONDUCTOR_ROOT}}/templates/code_styleguides/<language>.md\`
3. **Apply:** Use these rules for all code generation, refactoring, or review tasks.
4. **No Language?** If the user didn't specify a language, list the available options above and ask which one they need.

> [!NOTE]
> These guides are bridged from Gemini Conductor.
> **Source Directory:** [templates/code_styleguides](https://github.com/gemini-cli-extensions/conductor/tree/${sha}/templates/code_styleguides)

<!-- conductor-bridge-metadata:
  origin: templates/code_styleguides
  origin_sha: ${sha}
  available_languages: ${languages.join(', ')}
  generated_at: ${new Date().toISOString()}
-->
`;

    const outPath = path.join(OUTPUT_DIR, `conductor.styleguide.md`);
    fs.writeFileSync(outPath, mdContent);
    console.log(`  ✓ Generated conductor.styleguide.md`);
  }
}

sync().catch(console.error);
