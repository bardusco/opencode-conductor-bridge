import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createDefaultConfig,
  removeConductorFiles,
  uninstall,
  type UninstallConfig,
} from '../scripts/uninstall-bridge.js';

// Mock the modules
vi.mock('fs');

describe('uninstall-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDefaultConfig', () => {
    it('should create config with provided target project', () => {
      const targetProject = path.join('test', 'project');
      const config = createDefaultConfig(targetProject);

      expect(config.targetProject).toBe(targetProject);
    });
  });

  describe('removeConductorFiles', () => {
    it('should return empty result when directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = removeConductorFiles('/nonexistent');

      expect(result.directoryExists).toBe(false);
      expect(result.filesRemoved).toEqual([]);
    });

    it('should remove only conductor.* files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'conductor.setup.md',
        'conductor.implement.md',
        'other-file.md',
        'README.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);
      
      const testDir = path.join('test', 'dir');
      const result = removeConductorFiles(testDir);

      expect(result.directoryExists).toBe(true);
      expect(result.filesRemoved).toEqual(['conductor.setup.md', 'conductor.implement.md']);
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(testDir, 'conductor.setup.md'));
      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(testDir, 'conductor.implement.md'));
    });

    it('should return empty filesRemoved when no conductor files exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'other-file.md',
        'README.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);

      const result = removeConductorFiles(path.join('test', 'dir'));

      expect(result.directoryExists).toBe(true);
      expect(result.filesRemoved).toEqual([]);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('uninstall', () => {
    const testBase = path.join('test', 'project');
    const mockConfig: UninstallConfig = {
      targetProject: testBase,
    };

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.readdirSync).mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);
    });

    it('should return correct directory paths', async () => {
      const result = await uninstall(mockConfig);

      expect(result.targetOpencodeDir).toBe(path.join(testBase, '.opencode', 'command'));
      expect(result.legacyOpencodeDir).toBe(path.join(testBase, '.opencode', 'commands'));
      expect(result.conductorStateDir).toBe(path.join(testBase, 'conductor'));
    });

    it('should remove files from target opencode directory', async () => {
      const targetDir = path.join(testBase, '.opencode', 'command');
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === targetDir;
      });
      vi.mocked(fs.readdirSync).mockReturnValue([
        'conductor.setup.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = await uninstall(mockConfig);

      expect(result.targetFilesRemoved).toEqual(['conductor.setup.md']);
    });

    it('should remove files from legacy opencode directory', async () => {
      const legacyDir = path.join(testBase, '.opencode', 'commands');
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === legacyDir;
      });
      vi.mocked(fs.readdirSync).mockReturnValue([
        'conductor.implement.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = await uninstall(mockConfig);

      expect(result.legacyFilesRemoved).toEqual(['conductor.implement.md']);
    });

    it('should detect conductor state directory existence', async () => {
      const conductorDir = path.join(testBase, 'conductor');
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === conductorDir;
      });

      const result = await uninstall(mockConfig);

      expect(result.conductorStateDirExists).toBe(true);
    });

    it('should not flag conductor state dir when it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await uninstall(mockConfig);

      expect(result.conductorStateDirExists).toBe(false);
    });

    it('should remove files from both target and legacy directories', async () => {
      const targetDir = path.join(testBase, '.opencode', 'command');
      const legacyDir = path.join(testBase, '.opencode', 'commands');
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === targetDir || String(p) === legacyDir;
      });
      vi.mocked(fs.readdirSync).mockImplementation(((dirPath: fs.PathLike) => {
        if (String(dirPath) === targetDir) {
          return ['conductor.a.md'];
        }
        if (String(dirPath) === legacyDir) {
          return ['conductor.b.md'];
        }
        return [];
      }) as typeof fs.readdirSync);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = await uninstall(mockConfig);

      expect(result.targetFilesRemoved).toEqual(['conductor.a.md']);
      expect(result.legacyFilesRemoved).toEqual(['conductor.b.md']);
    });
  });
});
