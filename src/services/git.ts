import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import type { GitWorktree } from '../types/index.js';

const execAsync = promisify(exec);

export class GitService {
  async getRemoteUrl(repoPath: string): Promise<{ owner: string; repo: string } | null> {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: repoPath });
      const match = stdout.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
      return null;
    } catch {
      return null;
    }
  }

  async createWorktree(repoPath: string, issueNumber: number, issueTitle: string): Promise<GitWorktree> {
    const worktreeBase = join(repoPath, '.gitban_agent', 'worktrees');
    
    if (!existsSync(worktreeBase)) {
      mkdirSync(worktreeBase, { recursive: true });
    }
    
    const slug = issueTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    const branchName = `feature/issue-${issueNumber}-${slug}`;
    const worktreePath = join(worktreeBase, `issue-${issueNumber}`);
    
    try {
      await execAsync(`git worktree add "${worktreePath}" -b "${branchName}"`, {
        cwd: repoPath,
      });
    } catch (e) {
      const error = e as Error;
      if (error.message.includes('already exists')) {
        console.log('Worktree already exists');
      } else {
        throw e;
      }
    }
    
    return {
      path: worktreePath,
      branch: branchName,
      issueNumber,
    };
  }

  async commit(worktreePath: string, issueNumber: number, issueTitle: string): Promise<string> {
    const commitMessage = `feat(#${issueNumber}): ${issueTitle}\n\nCloses #${issueNumber}`;
    
    await execAsync('git add -A', { cwd: worktreePath });
    
    try {
      const { stdout } = await execAsync(`git commit -m "${commitMessage}"`, {
        cwd: worktreePath,
      });
      return stdout;
    } catch (e) {
      const error = e as Error;
      if (error.message.includes('nothing to commit')) {
        return 'No changes to commit';
      }
      throw e;
    }
  }

  async push(worktreePath: string): Promise<void> {
    await execAsync('git push -u origin HEAD', { cwd: worktreePath });
  }

  async removeWorktree(repoPath: string, worktreePath: string, branchName: string): Promise<void> {
    try {
      await execAsync(`git worktree remove "${worktreePath}" --force`, { cwd: repoPath });
    } catch {
      console.log('Worktree removal failed');
    }
    
    try {
      await execAsync(`git branch -D "${branchName}"`, { cwd: repoPath });
    } catch {
      console.log('Branch deletion failed or already deleted');
    }
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    const { stdout } = await execAsync('git branch --show-current', { cwd: repoPath });
    return stdout.trim();
  }

  async isGitRepo(path: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', { cwd: path });
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  }
}
