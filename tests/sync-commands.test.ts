import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  createDefaultConfig,
  getSubmoduleSha,
  getPackageVersion,
  yamlEscape,
  generateCommandMarkdown,
  generateStyleguideMarkdown,
  sync,
  type SyncConfig,
} from '../scripts/sync-commands.js';

// Mock the modules
vi.mock('fs');
vi.mock('child_process');

describe('sync-commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDefaultConfig', () => {
    it('should create config with correct paths for given cwd', () => {
      const cwd = path.join('test', 'project');
      const config = createDefaultConfig(cwd);

      expect(config.conductorSource).toBe(path.join(cwd, 'vendor', 'conductor'));
      expect(config.commandsSource).toBe(path.join(cwd, 'vendor', 'conductor', 'commands', 'conductor'));
      expect(config.templatesSource).toBe(path.join(cwd, 'vendor', 'conductor', 'templates', 'code_styleguides'));
      expect(config.outputDir).toBe(path.join(cwd, 'templates', 'opencode', 'command'));
      expect(config.packageJsonPath).toBe(path.join(cwd, 'package.json'));
    });

    it('should use process.cwd() when no cwd provided', () => {
      const config = createDefaultConfig();
      expect(config.conductorSource).toContain('vendor');
      expect(config.conductorSource).toContain('conductor');
    });
  });

  describe('getSubmoduleSha', () => {
    it('should return SHA from git command', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123def456\n'));
      const testPath = path.join('test', 'conductor');

      const sha = getSubmoduleSha(testPath);

      expect(execSync).toHaveBeenCalledWith('git rev-parse HEAD', { cwd: testPath });
      expect(sha).toBe('abc123def456');
    });

    it('should return "main" when git command fails', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });

      const sha = getSubmoduleSha(path.join('test', 'conductor'));

      expect(sha).toBe('main');
    });
  });

  describe('getPackageVersion', () => {
    it('should return version from package.json', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));
      const pkgPath = path.join('test', 'package.json');

      const version = getPackageVersion(pkgPath);

      expect(fs.readFileSync).toHaveBeenCalledWith(pkgPath, 'utf-8');
      expect(version).toBe('1.2.3');
    });

    it('should throw error when version is missing', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'test' }));

      expect(() => getPackageVersion(path.join('test', 'package.json'))).toThrow('package.json missing "version" field');
    });

    it('should throw error when package.json is invalid JSON', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('not valid json');

      expect(() => getPackageVersion(path.join('test', 'package.json'))).toThrow();
    });
  });

  describe('yamlEscape', () => {
    it('should escape backslashes', () => {
      expect(yamlEscape('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape double quotes', () => {
      expect(yamlEscape('say "hello"')).toBe('say \\"hello\\"');
    });

    it('should replace newlines with spaces', () => {
      expect(yamlEscape('line1\nline2\nline3')).toBe('line1 line2 line3');
    });

    it('should handle combined escapes in correct order', () => {
      expect(yamlEscape('path\\file\n"test"')).toBe('path\\\\file \\"test\\"');
    });

    it('should return empty string for empty input', () => {
      expect(yamlEscape('')).toBe('');
    });
  });

  describe('generateCommandMarkdown', () => {
    it('should generate correct markdown structure', () => {
      const md = generateCommandMarkdown(
        'setup',
        'Setup the project',
        'Run setup instructions',
        '1.0.0',
        'abc123',
        'setup.toml'
      );

      expect(md).toContain('description: "Setup the project"');
      expect(md).toContain('# Conductor Bridge: setup');
      expect(md).toContain('**Bridge Version:** 1.0.0');
      expect(md).toContain('**Conductor Source:** [setup.toml]');
      expect(md).toContain('abc123');
      expect(md).toContain('Run setup instructions');
      expect(md).toContain('origin_file: setup.toml');
      expect(md).toContain('origin_sha: abc123');
    });

    it('should replace Gemini extension path with placeholder', () => {
      const prompt = 'Read from ~/.gemini/extensions/conductor/file.md';
      const md = generateCommandMarkdown('test', 'desc', prompt, '1.0.0', 'sha', 'test.toml');

      expect(md).toContain('{{CONDUCTOR_ROOT}}/file.md');
      expect(md).not.toContain('~/.gemini/extensions/conductor');
    });

    it('should escape special characters in description', () => {
      const md = generateCommandMarkdown('test', 'Say "hello"\nworld', 'prompt', '1.0.0', 'sha', 'test.toml');

      expect(md).toContain('description: "Say \\"hello\\" world"');
    });
  });

  describe('generateStyleguideMarkdown', () => {
    it('should generate correct markdown with language list', () => {
      const languages = ['javascript', 'python', 'typescript'];
      const md = generateStyleguideMarkdown(languages, '1.0.0', 'abc123');

      expect(md).toContain('description: "Access language-specific code styleguides bridged from Conductor"');
      expect(md).toContain('# Conductor Styleguide');
      expect(md).toContain('- javascript');
      expect(md).toContain('- python');
      expect(md).toContain('- typescript');
      expect(md).toContain('**Bridge Version:** 1.0.0');
      expect(md).toContain('available_languages: javascript, python, typescript');
    });

    it('should handle empty language list', () => {
      const md = generateStyleguideMarkdown([], '1.0.0', 'sha');

      expect(md).toContain('### Available Styleguides');
      expect(md).toContain('available_languages: ');
    });
  });

  describe('sync', () => {
    // Use path.join for cross-platform compatibility
    const testBase = path.join('test');
    const mockConfig: SyncConfig = {
      conductorSource: path.join(testBase, 'vendor', 'conductor'),
      commandsSource: path.join(testBase, 'vendor', 'conductor', 'commands', 'conductor'),
      templatesSource: path.join(testBase, 'vendor', 'conductor', 'templates', 'code_styleguides'),
      outputDir: path.join(testBase, 'templates', 'opencode', 'command'),
      packageJsonPath: path.join(testBase, 'package.json'),
    };

    beforeEach(() => {
      // Setup default mocks
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123def'));
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (String(filePath) === mockConfig.packageJsonPath) {
          return JSON.stringify({ version: '1.0.0' });
        }
        if (String(filePath).endsWith('.toml')) {
          return 'description = "Test command"\nprompt = "Test prompt"';
        }
        return '';
      });
      vi.mocked(fs.readdirSync).mockImplementation(((dirPath: fs.PathLike) => {
        if (String(dirPath) === mockConfig.commandsSource) {
          return ['setup.toml', 'implement.toml'];
        }
        if (String(dirPath) === mockConfig.templatesSource) {
          return ['javascript.md', 'typescript.md'];
        }
        return [];
      }) as typeof fs.readdirSync);
    });

    it('should create output directory if it does not exist', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        if (String(p) === mockConfig.outputDir) return false;
        return true;
      });

      await sync(mockConfig);

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfig.outputDir, { recursive: true });
    });

    it('should not create output directory if it exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await sync(mockConfig);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should generate markdown files for each TOML command', async () => {
      const result = await sync(mockConfig);

      expect(result.commandsGenerated).toContain('conductor.setup.md');
      expect(result.commandsGenerated).toContain('conductor.implement.md');
      
      // Check that writeFileSync was called with paths ending in the expected filenames
      const calls = vi.mocked(fs.writeFileSync).mock.calls;
      const setupCall = calls.find(call => String(call[0]).endsWith('conductor.setup.md'));
      const implementCall = calls.find(call => String(call[0]).endsWith('conductor.implement.md'));
      
      expect(setupCall).toBeDefined();
      expect(implementCall).toBeDefined();
    });

    it('should generate styleguide markdown when templates exist', async () => {
      const result = await sync(mockConfig);

      expect(result.styleguideGenerated).toBe(true);
      
      const calls = vi.mocked(fs.writeFileSync).mock.calls;
      const styleguideCall = calls.find(call => String(call[0]).endsWith('conductor.styleguide.md'));
      expect(styleguideCall).toBeDefined();
    });

    it('should not generate styleguide when templates directory does not exist', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        if (String(p) === mockConfig.templatesSource) return false;
        return true;
      });

      const result = await sync(mockConfig);

      expect(result.styleguideGenerated).toBe(false);
    });

    it('should filter non-TOML files from commands directory', async () => {
      vi.mocked(fs.readdirSync).mockImplementation(((dirPath: fs.PathLike) => {
        if (String(dirPath) === mockConfig.commandsSource) {
          return ['setup.toml', 'README.md', '.gitkeep'];
        }
        return [];
      }) as typeof fs.readdirSync);

      const result = await sync(mockConfig);

      expect(result.commandsGenerated).toHaveLength(1);
      expect(result.commandsGenerated).toContain('conductor.setup.md');
    });

    it('should filter non-MD files from templates directory', async () => {
      vi.mocked(fs.readdirSync).mockImplementation(((dirPath: fs.PathLike) => {
        if (String(dirPath) === mockConfig.commandsSource) {
          return [];
        }
        if (String(dirPath) === mockConfig.templatesSource) {
          return ['javascript.md', 'README.txt', '.gitkeep'];
        }
        return [];
      }) as typeof fs.readdirSync);

      await sync(mockConfig);

      const styleguideCall = vi.mocked(fs.writeFileSync).mock.calls.find(
        call => String(call[0]).includes('styleguide')
      );
      expect(styleguideCall).toBeDefined();
      const content = styleguideCall![1] as string;
      expect(content).toContain('- javascript');
      expect(content).not.toContain('- README');
    });
  });
});
