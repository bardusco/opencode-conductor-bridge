import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { execSync } from 'child_process';

export interface SyncConfig {
  conductorSource: string;
  commandsSource: string;
  templatesSource: string;
  outputDir: string;
  packageJsonPath: string;
}

export function createDefaultConfig(cwd: string = process.cwd()): SyncConfig {
  const conductorSource = path.join(cwd, 'vendor/conductor');
  return {
    conductorSource,
    commandsSource: path.join(conductorSource, 'commands/conductor'),
    templatesSource: path.join(conductorSource, 'templates/code_styleguides'),
    outputDir: path.join(cwd, 'templates/opencode/command'),
    packageJsonPath: path.join(cwd, 'package.json'),
  };
}

export function getSubmoduleSha(conductorSource: string): string {
  try {
    return execSync('git rev-parse HEAD', { cwd: conductorSource }).toString().trim();
  } catch (e) {
    return 'main';
  }
}

export function getPackageVersion(packageJsonPath: string): string {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  if (!pkg.version) {
    throw new Error('package.json missing "version" field');
  }
  return pkg.version;
}

export function yamlEscape(str: string): string {
  // In YAML double-quoted strings, backslash introduces escape sequences
  // Order matters: escape backslash first, then quotes, then newlines
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
}

export function generateCommandMarkdown(
  commandName: string,
  description: string,
  prompt: string,
  version: string,
  sha: string,
  file: string
): string {
  const conductorExtensionPath = '~/.gemini/extensions/conductor';
  const placeholder = '{{CONDUCTOR_ROOT}}';
  
  const processedPrompt = prompt.split(conductorExtensionPath).join(placeholder);

  return `---
description: "${yamlEscape(description)}"
---

# Conductor Bridge: ${commandName}

> [!NOTE]
> This command is bridged from Gemini Conductor.
> **Bridge Version:** ${version}
> **Conductor Source:** [${file}](https://github.com/gemini-cli-extensions/conductor/blob/${sha}/commands/conductor/${file})
> **Local Reference:** \`{{CONDUCTOR_ROOT}}/commands/conductor/${file}\`

${processedPrompt}

<!-- conductor-bridge-metadata:
  origin_file: ${file}
  origin_sha: ${sha}
-->
`;
}

export function generateStyleguideMarkdown(
  languages: string[],
  version: string,
  sha: string
): string {
  return `---
description: "Access language-specific code styleguides bridged from Conductor"
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
4. **Apply Mode:** If the user specifically asks to *apply* a styleguide to the current file or context, summarize the most relevant rules from the file and explain how they apply to the current code.
5. **No Language?** If the user didn't specify a language, list the available options above and ask which one they need.

> [!NOTE]
> These guides are bridged from Gemini Conductor.
> **Bridge Version:** ${version}
> **Source Directory:** [templates/code_styleguides](https://github.com/gemini-cli-extensions/conductor/tree/${sha}/templates/code_styleguides)

<!-- conductor-bridge-metadata:
  origin: templates/code_styleguides
  origin_sha: ${sha}
  available_languages: ${languages.join(', ')}
-->
`;
}

export interface SyncResult {
  commandsGenerated: string[];
  styleguideGenerated: boolean;
}

export async function sync(config: SyncConfig): Promise<SyncResult> {
  const result: SyncResult = {
    commandsGenerated: [],
    styleguideGenerated: false,
  };

  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const sha = getSubmoduleSha(config.conductorSource);
  const version = getPackageVersion(config.packageJsonPath);
  
  // Sync TOML Commands
  const commandFiles = fs.readdirSync(config.commandsSource).filter(f => f.endsWith('.toml'));
  console.log(`Syncing commands from Conductor @ ${sha.substring(0, 7)}...`);

  for (const file of commandFiles) {
    const filePath = path.join(config.commandsSource, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = toml.parse(content);

    const commandName = path.basename(file, '.toml');
    const description = parsed.description || '';
    const prompt = parsed.prompt || '';

    const mdContent = generateCommandMarkdown(commandName, description, prompt, version, sha, file);

    const outPath = path.join(config.outputDir, `conductor.${commandName}.md`);
    fs.writeFileSync(outPath, mdContent);
    console.log(`  ✓ Generated conductor.${commandName}.md`);
    result.commandsGenerated.push(`conductor.${commandName}.md`);
  }

  // Sync Styleguides (Aggregated into a single command)
  if (fs.existsSync(config.templatesSource)) {
    const styleguideFiles = fs.readdirSync(config.templatesSource).filter(f => f.endsWith('.md'));
    const languages = styleguideFiles.map(f => path.basename(f, '.md')).sort();
    
    console.log(`Syncing styleguides (aggregated)...`);
    
    const mdContent = generateStyleguideMarkdown(languages, version, sha);

    const outPath = path.join(config.outputDir, `conductor.styleguide.md`);
    fs.writeFileSync(outPath, mdContent);
    console.log(`  ✓ Generated conductor.styleguide.md`);
    result.styleguideGenerated = true;
  }

  return result;
}

// Main execution - only runs when script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const config = createDefaultConfig();
  sync(config).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
