import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import {
  REPO_URL,
  getInstallDir,
  getTargetProject,
  run,
  runSilent,
  checkGitAvailable,
  ensureDirectoryExists,
  getLatestStableTag,
  getDesiredRef,
  install,
} from '../bin/install.js';

// Mock the modules
vi.mock('fs');
vi.mock('child_process');

describe('install.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('REPO_URL', () => {
    it('should be the correct GitHub URL', () => {
      expect(REPO_URL).toBe('https://github.com/bardusco/opencode-conductor-bridge.git');
    });
  });

  describe('getInstallDir', () => {
    it('should return path in user home .opencode directory', () => {
      const dir = getInstallDir();
      expect(dir).toBe(path.join(os.homedir(), '.opencode', 'conductor-bridge'));
    });
  });

  describe('getTargetProject', () => {
    it('should return current working directory', () => {
      expect(getTargetProject()).toBe(process.cwd());
    });
  });

  describe('run', () => {
    it('should return true on successful command', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));
      
      const result = run('echo test');
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('echo test', { cwd: process.cwd(), stdio: 'inherit' });
    });

    it('should return false on failed command', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('command failed');
      });
      
      const result = run('invalid-command');
      
      expect(result).toBe(false);
    });

    it('should use provided cwd', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));
      
      run('echo test', '/custom/path');
      
      expect(execSync).toHaveBeenCalledWith('echo test', { cwd: '/custom/path', stdio: 'inherit' });
    });
  });

  describe('runSilent', () => {
    it('should return true on successful command', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));
      
      const result = runSilent('echo test');
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('echo test', { cwd: process.cwd(), stdio: 'pipe' });
    });

    it('should return false on failed command', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('command failed');
      });
      
      const result = runSilent('invalid-command');
      
      expect(result).toBe(false);
    });
  });

  describe('checkGitAvailable', () => {
    it('should return true when git is available', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('git version 2.39.0'));
      
      expect(checkGitAvailable()).toBe(true);
    });

    it('should return false when git is not available', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('command not found');
      });
      
      expect(checkGitAvailable()).toBe(false);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
      
      const result = ensureDirectoryExists('/test/dir');
      
      expect(result).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should not create directory if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const result = ensureDirectoryExists('/test/dir');
      
      expect(result).toBe(false);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getLatestStableTag', () => {
    it('should return latest stable tag from git ls-remote output', () => {
      const output = `
abc123\trefs/tags/v1.0.0
def456\trefs/tags/v1.1.0
ghi789\trefs/tags/v1.2.0
jkl012\trefs/tags/v1.2.0-beta
`;
      vi.mocked(execSync).mockReturnValue(Buffer.from(output));
      
      const tag = getLatestStableTag('https://example.com/repo.git');
      
      expect(tag).toBe('v1.2.0');
    });

    it('should return null when no stable tags exist', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123\trefs/tags/beta-1'));
      
      const tag = getLatestStableTag('https://example.com/repo.git');
      
      expect(tag).toBeNull();
    });

    it('should return null on error', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('network error');
      });
      
      const tag = getLatestStableTag('https://example.com/repo.git');
      
      expect(tag).toBeNull();
    });
  });

  describe('getDesiredRef', () => {
    it('should return envRef if provided', () => {
      const ref = getDesiredRef('https://example.com/repo.git', 'v1.0.0');
      
      expect(ref).toBe('v1.0.0');
    });

    it('should return latest stable tag if no envRef', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('abc123\trefs/tags/v2.0.0'));
      
      const ref = getDesiredRef('https://example.com/repo.git', undefined);
      
      expect(ref).toBe('v2.0.0');
    });

    it('should return main if no envRef and no stable tags', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('error');
      });
      
      const ref = getDesiredRef('https://example.com/repo.git', undefined);
      
      expect(ref).toBe('main');
    });
  });

  describe('install', () => {
    beforeEach(() => {
      // Default successful mocks
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    });

    it('should return error when git is not available', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (cmd === 'git --version') {
          throw new Error('not found');
        }
        return Buffer.from('');
      });

      const result = await install({
        repoUrl: 'https://test.git',
        installDir: '/test/install',
        targetProject: '/test/project',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('git not found');
    });

    it('should clone repo if install dir does not exist', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p !== '/test/install';
      });

      const result = await install({
        repoUrl: 'https://test.git',
        installDir: '/test/install',
        targetProject: '/test/project',
        bridgeRef: 'v1.0.0',
      });

      expect(result.success).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'git clone --recursive https://test.git "/test/install"',
        expect.any(Object)
      );
    });

    it('should return success with correct result structure', async () => {
      const result = await install({
        repoUrl: 'https://test.git',
        installDir: '/test/install',
        targetProject: '/test/project',
        bridgeRef: 'v1.0.0',
      });

      expect(result.success).toBe(true);
      expect(result.ref).toBe('v1.0.0');
      expect(result.installDir).toBe('/test/install');
      expect(result.targetProject).toBe('/test/project');
    });

    it('should return error when clone fails', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p !== '/test/install';
      });
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (String(cmd).includes('clone')) {
          throw new Error('clone failed');
        }
        return Buffer.from('');
      });

      const result = await install({
        repoUrl: 'https://test.git',
        installDir: '/test/install',
        targetProject: '/test/project',
        bridgeRef: 'v1.0.0',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('clone failed');
    });

    it('should skip clone if install dir exists', async () => {
      const cloneCalls: string[] = [];
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (String(cmd).includes('clone')) {
          cloneCalls.push(String(cmd));
        }
        return Buffer.from('');
      });

      await install({
        repoUrl: 'https://test.git',
        installDir: '/test/install',
        targetProject: '/test/project',
        bridgeRef: 'v1.0.0',
      });

      expect(cloneCalls).toHaveLength(0);
    });
  });
});
