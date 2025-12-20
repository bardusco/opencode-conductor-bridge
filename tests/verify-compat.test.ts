import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { execSync } from 'child_process';
import {
  createDefaultConfig,
  getPackageVersion,
  getConductorSha,
  extractDocumentedSha,
  verify,
  type VerifyCompatConfig,
} from '../scripts/verify-compat.js';

// Mock the modules
vi.mock('fs');
vi.mock('child_process');

describe('verify-compat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDefaultConfig', () => {
    it('should create config with correct paths for given cwd', () => {
      const config = createDefaultConfig('/test/project');

      expect(config.readmePath).toBe('/test/project/README.md');
      expect(config.packagePath).toBe('/test/project/package.json');
      expect(config.conductorPath).toBe('/test/project/vendor/conductor');
    });

    it('should use process.cwd() when no cwd provided', () => {
      const config = createDefaultConfig();
      expect(config.readmePath).toContain('README.md');
    });
  });

  describe('getPackageVersion', () => {
    it('should return version from package.json', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

      const version = getPackageVersion('/test/package.json');

      expect(version).toBe('1.2.3');
    });
  });

  describe('getConductorSha', () => {
    it('should return trimmed 7-char SHA from git command', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123def456789\n'));

      const sha = getConductorSha('/test/conductor');

      expect(execSync).toHaveBeenCalledWith('git rev-parse HEAD', { cwd: '/test/conductor' });
      expect(sha).toBe('abc123d');
    });

    it('should throw error when git command fails', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });

      expect(() => getConductorSha('/test/conductor')).toThrow('git not found');
    });
  });

  describe('extractDocumentedSha', () => {
    it('should extract SHA from valid README matrix', () => {
      const readme = `
# README
## Compatibility Matrix
| Bridge Version | Conductor SHA |
| **v1.2.3** | [abc123d](https://github.com/...) |
| v1.2.2 | [def456](https://github.com/...) |
`;
      const sha = extractDocumentedSha(readme, '1.2.3');

      expect(sha).toBe('abc123d');
    });

    it('should return null when version not found', () => {
      const readme = `
# README
## Compatibility Matrix
| **v1.0.0** | [abc123d](https://github.com/...) |
`;
      const sha = extractDocumentedSha(readme, '2.0.0');

      expect(sha).toBeNull();
    });

    it('should handle version with dots correctly', () => {
      const readme = `| **v1.2.3** | [abc1234](https://github.com/...) |`;
      const sha = extractDocumentedSha(readme, '1.2.3');

      expect(sha).toBe('abc1234');
    });

    it('should truncate SHA to 7 characters', () => {
      const readme = `| **v1.0.0** | [abc123def456789](https://github.com/...) |`;
      const sha = extractDocumentedSha(readme, '1.0.0');

      expect(sha).toBe('abc123d');
    });
  });

  describe('verify', () => {
    const mockConfig: VerifyCompatConfig = {
      readmePath: '/test/README.md',
      packagePath: '/test/package.json',
      conductorPath: '/test/vendor/conductor',
    };

    beforeEach(() => {
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (filePath === mockConfig.packagePath) {
          return JSON.stringify({ version: '1.2.3' });
        }
        if (filePath === mockConfig.readmePath) {
          return `| **v1.2.3** | [abc1234](https://github.com/...) |`;
        }
        return '';
      });
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc1234567890\n'));
    });

    it('should return success when versions match', async () => {
      const result = await verify(mockConfig);

      expect(result.success).toBe(true);
      expect(result.version).toBe('1.2.3');
      expect(result.currentSha).toBe('abc1234');
      expect(result.documentedSha).toBe('abc1234');
      expect(result.error).toBeUndefined();
    });

    it('should return error when conductor SHA cannot be determined', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });

      const result = await verify(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not determine Conductor submodule SHA.');
    });

    it('should return error when version not in README matrix', async () => {
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (filePath === mockConfig.packagePath) {
          return JSON.stringify({ version: '2.0.0' });
        }
        if (filePath === mockConfig.readmePath) {
          return `| **v1.2.3** | [abc1234](https://github.com/...) |`;
        }
        return '';
      });

      const result = await verify(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in README');
    });

    it('should return error when SHAs do not match', async () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('different\n'));

      const result = await verify(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('mismatch');
      expect(result.currentSha).toBe('differe');
      expect(result.documentedSha).toBe('abc1234');
    });
  });
});
