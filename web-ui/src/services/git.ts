import { exec, spawn, type ChildProcess } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

const execAsync = promisify(exec);

export interface GitWorktree {
  path: string;
  branch: string;
  issueNumber: number;
}

export async function getRemoteUrl(repoPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git remote -v', { cwd: repoPath });
    const match = stdout.match(/origin\s+https:\/\/github\.com\/([^/]+)\/([^.]+?)(?:\.git)?/);
    return match ? `https://github.com/${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}

export async function createWorktree(
  repoPath: string,
  issueNumber: number,
  issueTitle: string
): Promise<GitWorktree> {
  const worktreeDir = join(repoPath, '.gitban_agent', 'worktrees', `issue-${issueNumber}`);
  
  if (!existsSync(worktreeDir)) {
    mkdirSync(worktreeDir, { recursive: true });
  }
  
  const slug = issueTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  const branchName = `feature/issue-${issueNumber}-${slug}`;
  
  try {
    await execAsync(`git worktree add "${worktreeDir}" -b "${branchName}"`, {
      cwd: repoPath
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes('already exists')) {
      console.log('Worktree already exists, using existing one');
    } else {
      throw e;
    }
  }
  
  return {
    path: worktreeDir,
    branch: branchName,
    issueNumber
  };
}

export async function commitChanges(
  worktreePath: string,
  issueNumber: number,
  issueTitle: string,
  message?: string
): Promise<string> {
  const commitMessage = message || `feat(#${issueNumber}): ${issueTitle}\n\nCloses #${issueNumber}`;
  
  await execAsync('git add -A', { cwd: worktreePath });
  
  try {
    const { stdout } = await execAsync(`git commit -m "${commitMessage}"`, {
      cwd: worktreePath
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

export async function pushBranch(worktreePath: string): Promise<void> {
  await execAsync('git push -u origin HEAD', { cwd: worktreePath });
}

export async function removeWorktree(
  repoPath: string,
  worktreePath: string,
  branchName: string
): Promise<void> {
  try {
    await execAsync(`git worktree remove "${worktreePath}" --force`, { cwd: repoPath });
  } catch {
    console.log('Worktree removal failed, trying manual cleanup');
  }
  
  try {
    await execAsync(`git branch -D "${branchName}"`, { cwd: repoPath });
  } catch {
    console.log('Branch deletion failed or branch already deleted');
  }
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
  const { stdout } = await execAsync('git branch --show-current', { cwd: repoPath });
  return stdout.trim();
}

export async function isMainBranch(repoPath: string): Promise<boolean> {
  const branch = await getCurrentBranch(repoPath);
  return branch === 'main' || branch === 'master';
}

export async function ensureGitignore(repoPath: string): Promise<void> {
  const gitignorePath = join(repoPath, '.gitignore');
  const gitbanEntry = '.gitban_agent/';
  
  try {
    const content = existsSync(gitignorePath) 
      ? await import('fs').then(fs => fs.readFileSync(gitignorePath, 'utf-8'))
      : '';
    
    if (!content.includes(gitbanEntry)) {
      const newContent = content + (content.endsWith('\n') ? '' : '\n') + gitbanEntry;
      await import('fs').then(fs => fs.writeFileSync(gitignorePath, newContent));
    }
  } catch {
    console.log('Failed to update .gitignore');
  }
}
