import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
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
      const cwd = '/test/project';
      const config = createDefaultConfig(cwd);

      expect(config.conductorSource).toBe('/test/project/vendor/conductor');
      expect(config.commandsSource).toBe('/test/project/vendor/conductor/commands/conductor');
      expect(config.templatesSource).toBe('/test/project/vendor/conductor/templates/code_styleguides');
      expect(config.outputDir).toBe('/test/project/templates/opencode/command');
      expect(config.packageJsonPath).toBe('/test/project/package.json');
    });

    it('should use process.cwd() when no cwd provided', () => {
      const config = createDefaultConfig();
      expect(config.conductorSource).toContain('vendor/conductor');
    });
  });

  describe('getSubmoduleSha', () => {
    it('should return SHA from git command', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123def456\n'));

      const sha = getSubmoduleSha('/test/conductor');

      expect(execSync).toHaveBeenCalledWith('git rev-parse HEAD', { cwd: '/test/conductor' });
      expect(sha).toBe('abc123def456');
    });

    it('should return "main" when git command fails', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });

      const sha = getSubmoduleSha('/test/conductor');

      expect(sha).toBe('main');
    });
  });

  describe('getPackageVersion', () => {
    it('should return version from package.json', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

      const version = getPackageVersion('/test/package.json');

      expect(fs.readFileSync).toHaveBeenCalledWith('/test/package.json', 'utf-8');
      expect(version).toBe('1.2.3');
    });

    it('should throw error when version is missing', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'test' }));

      expect(() => getPackageVersion('/test/package.json')).toThrow('package.json missing "version" field');
    });

    it('should throw error when package.json is invalid JSON', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('not valid json');

      expect(() => getPackageVersion('/test/package.json')).toThrow();
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
    const mockConfig: SyncConfig = {
      conductorSource: '/test/vendor/conductor',
      commandsSource: '/test/vendor/conductor/commands/conductor',
      templatesSource: '/test/vendor/conductor/templates/code_styleguides',
      outputDir: '/test/templates/opencode/command',
      packageJsonPath: '/test/package.json',
    };

    beforeEach(() => {
      // Setup default mocks
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123def'));
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (filePath === mockConfig.packageJsonPath) {
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
        if (p === mockConfig.outputDir) return false;
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
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/templates/opencode/command/conductor.setup.md',
        expect.any(String)
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/templates/opencode/command/conductor.implement.md',
        expect.any(String)
      );
    });

    it('should generate styleguide markdown when templates exist', async () => {
      const result = await sync(mockConfig);

      expect(result.styleguideGenerated).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/templates/opencode/command/conductor.styleguide.md',
        expect.any(String)
      );
    });

    it('should not generate styleguide when templates directory does not exist', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        if (p === mockConfig.templatesSource) return false;
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
