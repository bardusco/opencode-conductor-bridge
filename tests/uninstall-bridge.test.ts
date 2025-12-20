import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
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
      const config = createDefaultConfig('/test/project');

      expect(config.targetProject).toBe('/test/project');
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

      const result = removeConductorFiles('/test/dir');

      expect(result.directoryExists).toBe(true);
      expect(result.filesRemoved).toEqual(['conductor.setup.md', 'conductor.implement.md']);
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/dir/conductor.setup.md');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/dir/conductor.implement.md');
    });

    it('should return empty filesRemoved when no conductor files exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'other-file.md',
        'README.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);

      const result = removeConductorFiles('/test/dir');

      expect(result.directoryExists).toBe(true);
      expect(result.filesRemoved).toEqual([]);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('uninstall', () => {
    const mockConfig: UninstallConfig = {
      targetProject: '/test/project',
    };

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.readdirSync).mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);
    });

    it('should return correct directory paths', async () => {
      const result = await uninstall(mockConfig);

      expect(result.targetOpencodeDir).toBe('/test/project/.opencode/command');
      expect(result.legacyOpencodeDir).toBe('/test/project/.opencode/commands');
      expect(result.conductorStateDir).toBe('/test/project/conductor');
    });

    it('should remove files from target opencode directory', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === '/test/project/.opencode/command';
      });
      vi.mocked(fs.readdirSync).mockReturnValue([
        'conductor.setup.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = await uninstall(mockConfig);

      expect(result.targetFilesRemoved).toEqual(['conductor.setup.md']);
    });

    it('should remove files from legacy opencode directory', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === '/test/project/.opencode/commands';
      });
      vi.mocked(fs.readdirSync).mockReturnValue([
        'conductor.implement.md',
      ] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = await uninstall(mockConfig);

      expect(result.legacyFilesRemoved).toEqual(['conductor.implement.md']);
    });

    it('should detect conductor state directory existence', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === '/test/project/conductor';
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
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === '/test/project/.opencode/command' || 
               p === '/test/project/.opencode/commands';
      });
      vi.mocked(fs.readdirSync).mockImplementation(((dirPath: fs.PathLike) => {
        if (String(dirPath) === '/test/project/.opencode/command') {
          return ['conductor.a.md'];
        }
        if (String(dirPath) === '/test/project/.opencode/commands') {
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
