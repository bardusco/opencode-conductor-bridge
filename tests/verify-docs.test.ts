import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import {
  createDefaultConfig,
  getPackageVersion,
  verifyReadme,
  verifyTemplates,
  verifyDocs,
  type VerifyDocsConfig,
} from '../scripts/verify-docs.js';

// Mock the modules
vi.mock('fs');

describe('verify-docs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDefaultConfig', () => {
    it('should create config with correct paths for given root', () => {
      const config = createDefaultConfig('/test/project');

      expect(config.root).toBe('/test/project');
      expect(config.packagePath).toBe('/test/project/package.json');
      expect(config.readmePath).toBe('/test/project/README.md');
      expect(config.templatesDir).toBe('/test/project/templates/opencode/command');
    });

    it('should use process.cwd() when no root provided', () => {
      const config = createDefaultConfig();
      expect(config.root).toBe(process.cwd());
    });
  });

  describe('getPackageVersion', () => {
    it('should return version from package.json', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

      const version = getPackageVersion('/test/package.json');

      expect(version).toBe('1.2.3');
    });

    it('should throw error when version is missing', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'test' }));

      expect(() => getPackageVersion('/test/package.json')).toThrow('package.json missing "version" field');
    });
  });

  describe('verifyReadme', () => {
    const validReadme = `# OpenCode Conductor Bridge (v1.2.3)

Some content here.

BRIDGE_REF="v1.2.3"

git checkout v1.2.3

| **v1.2.3** | [abc123](url) |

latest stable tag (e.g., \`v1.2.3\`)
`;

    it('should return valid for correct README', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(validReadme);

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing title version', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('# Some Other Title');

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('README title missing version');
    });

    it('should detect wrong title version', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('# OpenCode Conductor Bridge (v1.0.0)');

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('README title has v1.0.0'))).toBe(true);
    });

    it('should detect wrong BRIDGE_REF version', () => {
      const readme = `# OpenCode Conductor Bridge (v1.2.3)
BRIDGE_REF="v1.0.0"
| **v1.2.3** |`;
      vi.mocked(fs.readFileSync).mockReturnValue(readme);

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BRIDGE_REF example has v1.0.0'))).toBe(true);
    });

    it('should detect wrong git checkout version', () => {
      const readme = `# OpenCode Conductor Bridge (v1.2.3)
git checkout v1.0.0
| **v1.2.3** |`;
      vi.mocked(fs.readFileSync).mockReturnValue(readme);

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('git checkout example has v1.0.0'))).toBe(true);
    });

    it('should detect missing compatibility matrix', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('# OpenCode Conductor Bridge (v1.2.3)\nNo matrix here');

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Compatibility matrix missing current version (bold)');
    });

    it('should detect wrong matrix version', () => {
      const readme = `# OpenCode Conductor Bridge (v1.2.3)
| **v1.0.0** |`;
      vi.mocked(fs.readFileSync).mockReturnValue(readme);

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Compatibility matrix shows v1.0.0'))).toBe(true);
    });

    it('should detect wrong stable tag example', () => {
      const readme = `# OpenCode Conductor Bridge (v1.2.3)
| **v1.2.3** |
latest stable tag (e.g., \`v1.0.0\`)`;
      vi.mocked(fs.readFileSync).mockReturnValue(readme);

      const result = verifyReadme('/test/README.md', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('"latest stable tag" example has v1.0.0'))).toBe(true);
    });
  });

  describe('verifyTemplates', () => {
    it('should return invalid when templates directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = verifyTemplates('/test/templates', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('templates directory not found');
    });

    it('should return valid when all templates have correct version', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['cmd1.md', 'cmd2.md'] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockReturnValue('**Bridge Version:** 1.2.3');

      const result = verifyTemplates('/test/templates', '1.2.3');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect wrong template version', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['cmd1.md'] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockReturnValue('**Bridge Version:** 1.0.0');

      const result = verifyTemplates('/test/templates', '1.2.3');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cmd1.md has Bridge Version 1.0.0'))).toBe(true);
    });

    it('should filter non-.md files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['cmd1.md', 'README.txt', '.gitkeep'] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockReturnValue('**Bridge Version:** 1.2.3');

      const result = verifyTemplates('/test/templates', '1.2.3');

      expect(fs.readFileSync).toHaveBeenCalledTimes(1); // Only cmd1.md
      expect(result.valid).toBe(true);
    });

    it('should handle templates without version field', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['cmd1.md'] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockReturnValue('No version here');

      const result = verifyTemplates('/test/templates', '1.2.3');

      expect(result.valid).toBe(true); // No version field = no error
    });
  });

  describe('verifyDocs', () => {
    const mockConfig: VerifyDocsConfig = {
      root: '/test',
      packagePath: '/test/package.json',
      readmePath: '/test/README.md',
      templatesDir: '/test/templates/opencode/command',
    };

    const validReadme = `# OpenCode Conductor Bridge (v1.2.3)
| **v1.2.3** |`;

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['cmd1.md'] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (String(filePath) === mockConfig.packagePath) {
          return JSON.stringify({ version: '1.2.3' });
        }
        if (String(filePath) === mockConfig.readmePath) {
          return validReadme;
        }
        return '**Bridge Version:** 1.2.3';
      });
    });

    it('should return success when all docs are valid', async () => {
      const result = await verifyDocs(mockConfig);

      expect(result.success).toBe(true);
      expect(result.version).toBe('1.2.3');
      expect(result.readmeResult.valid).toBe(true);
      expect(result.templatesResult.valid).toBe(true);
    });

    it('should return failure when readme is invalid', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (String(filePath) === mockConfig.packagePath) {
          return JSON.stringify({ version: '1.2.3' });
        }
        if (String(filePath) === mockConfig.readmePath) {
          return '# Wrong Title';
        }
        return '**Bridge Version:** 1.2.3';
      });

      const result = await verifyDocs(mockConfig);

      expect(result.success).toBe(false);
      expect(result.readmeResult.valid).toBe(false);
    });

    it('should return failure when templates are invalid', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await verifyDocs(mockConfig);

      expect(result.success).toBe(false);
      expect(result.templatesResult.valid).toBe(false);
    });
  });
});
