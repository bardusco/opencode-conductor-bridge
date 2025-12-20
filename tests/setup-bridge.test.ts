import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createDefaultConfig,
  handleLegacyDirectory,
  processTemplateContent,
  setup,
  type SetupConfig,
} from '../scripts/setup-bridge.js';

// Mock the modules
vi.mock('fs');

describe('setup-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDefaultConfig', () => {
    it('should create config with correct paths', () => {
      const bridgeRoot = path.join('test', 'bridge');
      const targetProject = path.join('test', 'project');
      const config = createDefaultConfig(bridgeRoot, targetProject);

      expect(config.bridgeRoot).toBe(bridgeRoot);
      expect(config.vendorConductor).toBe(path.join(bridgeRoot, 'vendor', 'conductor'));
      expect(config.commandsDir).toBe(path.join(bridgeRoot, 'templates', 'opencode', 'command'));
      expect(config.targetProject).toBe(targetProject);
    });

    it('should use process.cwd() as default bridgeRoot', () => {
      const config = createDefaultConfig();
      expect(config.bridgeRoot).toBe(process.cwd());
    });
  });

  describe('handleLegacyDirectory', () => {
    it('should return false values when legacy dir does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = handleLegacyDirectory('/legacy', '/target');

      expect(result).toEqual({ moved: false, warning: false });
    });

    it('should move legacy dir when target does not exist', () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === '/legacy';
      });
      vi.mocked(fs.renameSync).mockReturnValue(undefined);

      const result = handleLegacyDirectory('/legacy', '/target');

      expect(fs.renameSync).toHaveBeenCalledWith('/legacy', '/target');
      expect(result).toEqual({ moved: true, warning: false });
    });

    it('should warn when both legacy and target exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = handleLegacyDirectory('/legacy', '/target');

      expect(fs.renameSync).not.toHaveBeenCalled();
      expect(result).toEqual({ moved: false, warning: true });
    });
  });

  describe('processTemplateContent', () => {
    it('should replace CONDUCTOR_ROOT placeholder', () => {
      const content = 'Path: {{CONDUCTOR_ROOT}}/file.md';
      const result = processTemplateContent(content, '/vendor/conductor', '/bridge');

      expect(result).toBe('Path: /vendor/conductor/file.md');
    });

    it('should replace BRIDGE_ROOT placeholder', () => {
      const content = 'Path: {{BRIDGE_ROOT}}/scripts';
      const result = processTemplateContent(content, '/vendor/conductor', '/bridge');

      expect(result).toBe('Path: /bridge/scripts');
    });

    it('should replace multiple occurrences of both placeholders', () => {
      const content = '{{CONDUCTOR_ROOT}}/a {{BRIDGE_ROOT}}/b {{CONDUCTOR_ROOT}}/c';
      const result = processTemplateContent(content, '/vc', '/br');

      expect(result).toBe('/vc/a /br/b /vc/c');
    });

    it('should return unchanged content when no placeholders', () => {
      const content = 'No placeholders here';
      const result = processTemplateContent(content, '/vc', '/br');

      expect(result).toBe('No placeholders here');
    });
  });

  describe('setup', () => {
    // Use path.join for cross-platform compatibility
    const testBase = path.join('test');
    const mockConfig: SetupConfig = {
      bridgeRoot: path.join(testBase, 'bridge'),
      vendorConductor: path.join(testBase, 'bridge', 'vendor', 'conductor'),
      commandsDir: path.join(testBase, 'bridge', 'templates', 'opencode', 'command'),
      targetProject: path.join(testBase, 'project'),
    };

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
      vi.mocked(fs.readFileSync).mockReturnValue('content with {{CONDUCTOR_ROOT}} placeholder');
      vi.mocked(fs.readdirSync).mockReturnValue((['cmd1.md', 'cmd2.md']) as unknown as ReturnType<typeof fs.readdirSync>);
    });

    it('should create target opencode directory if it does not exist', async () => {
      await setup(mockConfig);

      const expectedDir = path.join(mockConfig.targetProject, '.opencode', 'command');
      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      const targetDir = path.join(mockConfig.targetProject, '.opencode', 'command');
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === targetDir;
      });

      await setup(mockConfig);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should install all .md files from commands directory', async () => {
      const result = await setup(mockConfig);

      expect(result.filesInstalled).toEqual(['cmd1.md', 'cmd2.md']);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should filter non-.md files', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['cmd1.md', 'README.txt', '.gitkeep'] as unknown as ReturnType<typeof fs.readdirSync>);

      const result = await setup(mockConfig);

      expect(result.filesInstalled).toEqual(['cmd1.md']);
    });

    it('should process template content for each file', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['test.md'] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockReturnValue('{{CONDUCTOR_ROOT}}/path and {{BRIDGE_ROOT}}/other');

      await setup(mockConfig);

      const expectedContent = `${mockConfig.vendorConductor}/path and ${mockConfig.bridgeRoot}/other`;
      const calls = vi.mocked(fs.writeFileSync).mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][1]).toBe(expectedContent);
    });

    it('should return correct result structure', async () => {
      const result = await setup(mockConfig);

      expect(result.targetOpencodeDir).toBe(path.join(mockConfig.targetProject, '.opencode', 'command'));
      expect(result.filesInstalled).toHaveLength(2);
      expect(result.legacyDirMoved).toBe(false);
      expect(result.legacyDirWarning).toBe(false);
    });

    it('should handle legacy directory migration', async () => {
      const legacyDir = path.join(mockConfig.targetProject, '.opencode', 'commands');
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p) === legacyDir;
      });

      const result = await setup(mockConfig);

      expect(fs.renameSync).toHaveBeenCalled();
      expect(result.legacyDirMoved).toBe(true);
    });

    it('should warn when both legacy and target directories exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await setup(mockConfig);

      expect(fs.renameSync).not.toHaveBeenCalled();
      expect(result.legacyDirWarning).toBe(true);
    });
  });
});
