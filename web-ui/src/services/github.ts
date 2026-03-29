import { Octokit } from 'octokit';
import { githubToken } from '../stores/settings';

export interface GitHubRepo {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  created_at: string;
  updated_at: string;
  comments: number;
  url: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: { login: string };
  created_at: string;
}

let octokit: Octokit | null = null;

export function getOctokit(): Octokit | null {
  return octokit;
}

export function initOctokit(token: string) {
  octokit = new Octokit({ auth: token });
  githubToken.set(token);
  return octokit;
}

export function parseGitRemote(remoteOutput: string): GitHubRepo | null {
  const match = remoteOutput.match(/origin\s+https:\/\/github\.com\/([^/]+)\/([^.]+?)(?:\.git)?\s+\(/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      fullName: `${match[1]}/${match[2]}`,
      url: `https://github.com/${match[1]}/${match[2]}`
    };
  }
  return null;
}

export async function getUserRepos(): Promise<GitHubRepo[]> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: 'updated'
  });
  
  return response.data.map(repo => ({
    owner: repo.owner.login,
    repo: repo.name,
    fullName: repo.full_name,
    url: repo.html_url
  }));
}

export async function getIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'all',
    per_page: 100
  });
  
  return response.data.map(issue => ({
    number: issue.number,
    title: issue.title,
    body: issue.body ?? null,
    state: issue.state as 'open' | 'closed',
    labels: issue.labels.map(l => typeof l === 'string' ? l : l.name).filter((l): l is string => l !== undefined),
    assignees: issue.assignees?.map(a => a.login) ?? [],
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    comments: issue.comments,
    url: issue.html_url
  }));
}

export async function createIssue(owner: string, repo: string, title: string, body: string, labels: string[] = []): Promise<GitHubIssue> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    labels
  });
  
  return {
    number: response.data.number,
    title: response.data.title,
    body: response.data.body ?? null,
    state: response.data.state as 'open' | 'closed',
    labels: response.data.labels.map(l => typeof l === 'string' ? l : l.name).filter((l): l is string => l !== undefined),
    assignees: response.data.assignees?.map(a => a.login) ?? [],
    created_at: response.data.created_at,
    updated_at: response.data.updated_at,
    comments: response.data.comments,
    url: response.data.html_url
  };
}

export async function updateIssue(owner: string, repo: string, number: number, changes: {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
}): Promise<GitHubIssue> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: number,
    ...changes
  });
  
  return {
    number: response.data.number,
    title: response.data.title,
    body: response.data.body ?? null,
    state: response.data.state as 'open' | 'closed',
    labels: response.data.labels.map(l => typeof l === 'string' ? l : l.name).filter((l): l is string => l !== undefined),
    assignees: response.data.assignees?.map(a => a.login) ?? [],
    created_at: response.data.created_at,
    updated_at: response.data.updated_at,
    comments: response.data.comments,
    url: response.data.html_url
  };
}

export async function addComment(owner: string, repo: string, issueNumber: number, body: string): Promise<GitHubComment> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  });
  
  return {
    id: response.data.id,
    body: response.data.body ?? '',
    user: { login: response.data.user?.login || 'unknown' },
    created_at: response.data.created_at
  };
}

export async function getComments(owner: string, repo: string, issueNumber: number): Promise<GitHubComment[]> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100
  });
  
  return response.data.map(comment => ({
    id: comment.id,
    body: comment.body ?? '',
    user: { login: comment.user?.login || 'unknown' },
    created_at: comment.created_at
  }));
}

export async function createPR(owner: string, repo: string, title: string, body: string, head: string, base: string): Promise<{ url: string; number: number }> {
  if (!octokit) throw new Error('Octokit not initialized');
  
  const response = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base
  });
  
  return {
    url: response.data.html_url,
    number: response.data.number
  };
}
