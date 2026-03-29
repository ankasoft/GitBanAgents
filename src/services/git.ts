import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import type { GitWorktree, Issue, Comment } from '../types/index.js';

const execAsync = promisify(exec);

export interface GhIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  created_at: string;
  updated_at: string;
  comments: number;
  url: string;
}

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

  async getRepoInfo(repoPath: string): Promise<{ owner: string; repo: string; branch: string } | null> {
    try {
      const [remote, branch] = await Promise.all([
        this.getRemoteUrl(repoPath),
        this.getCurrentBranch(repoPath)
      ]);
      
      if (!remote) return null;
      
      return {
        owner: remote.owner,
        repo: remote.repo,
        branch: branch || 'main'
      };
    } catch {
      return null;
    }
  }

  async getGitHubIssues(repoPath: string): Promise<GhIssue[]> {
    try {
      const { stdout } = await execAsync(
        'gh issue list --json number,title,body,state,labels,assignees,createdAt,updatedAt,comments,url',
        { cwd: repoPath }
      );
      const issues = JSON.parse(stdout);
      return issues.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        assignees: issue.assignees.map((a: any) => a.login),
        created_at: issue.createdAt,
        updated_at: issue.updatedAt,
        comments: issue.comments,
        url: issue.url,
      }));
    } catch (e) {
      console.error('Failed to fetch GitHub issues:', e);
      return [];
    }
  }

  async createGitHubIssue(repoPath: string, title: string, body: string, labels: string[] = []): Promise<GhIssue | null> {
    try {
      const labelArg = labels.length > 0 ? `--label "${labels.join(',')}"` : '';
      const { stdout } = await execAsync(
        `gh issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" ${labelArg} --json number,title,body,state,labels,assignees,createdAt,updatedAt,comments,url`,
        { cwd: repoPath }
      );
      const issue = JSON.parse(stdout);
      return {
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        assignees: issue.assignees.map((a: any) => a.login),
        created_at: issue.createdAt,
        updated_at: issue.updatedAt,
        comments: issue.comments,
        url: issue.url,
      };
    } catch (e) {
      console.error('Failed to create GitHub issue:', e);
      return null;
    }
  }

  async closeGitHubIssue(repoPath: string, issueNumber: number): Promise<boolean> {
    try {
      await execAsync(`gh issue close ${issueNumber}`, { cwd: repoPath });
      return true;
    } catch (e) {
      console.error('Failed to close GitHub issue:', e);
      return false;
    }
  }
}
