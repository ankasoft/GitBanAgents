import { Octokit } from '@octokit/rest';
import type { GitHubIssue, GitHubComment } from '../types/index.js';

export class GitHubService {
  private octokit: Octokit | null = null;

  init(token: string): void {
    this.octokit = new Octokit({ auth: token });
  }

  isInitialized(): boolean {
    return this.octokit !== null;
  }

  async getIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });
    
    return response.data.map(issue => ({
      number: issue.number,
      title: issue.title,
      body: issue.body ?? null,
      state: issue.state as 'open' | 'closed',
      labels: issue.labels.map(l => typeof l === 'string' ? l : l.name),
      assignees: issue.assignees?.map(a => a.login) ?? [],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      comments: issue.comments,
      url: issue.html_url,
    }));
  }

  async getIssue(owner: string, repo: string, number: number): Promise<GitHubIssue> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.issues.get({
      owner,
      repo,
      issue_number: number,
    });
    
    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body ?? null,
      state: response.data.state as 'open' | 'closed',
      labels: response.data.labels.map(l => typeof l === 'string' ? l : l.name),
      assignees: response.data.assignees?.map(a => a.login) ?? [],
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      comments: response.data.comments,
      url: response.data.html_url,
    };
  }

  async createIssue(owner: string, repo: string, title: string, body: string, labels: string[] = []): Promise<GitHubIssue> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    
    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body ?? null,
      state: response.data.state as 'open' | 'closed',
      labels: response.data.labels.map(l => typeof l === 'string' ? l : l.name),
      assignees: response.data.assignees?.map(a => a.login) ?? [],
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      comments: response.data.comments,
      url: response.data.html_url,
    };
  }

  async updateIssue(owner: string, repo: string, number: number, changes: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
  }): Promise<GitHubIssue> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.issues.update({
      owner,
      repo,
      issue_number: number,
      ...changes,
    });
    
    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body ?? null,
      state: response.data.state as 'open' | 'closed',
      labels: response.data.labels.map(l => typeof l === 'string' ? l : l.name),
      assignees: response.data.assignees?.map(a => a.login) ?? [],
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      comments: response.data.comments,
      url: response.data.html_url,
    };
  }

  async getComments(owner: string, repo: string, issueNumber: number): Promise<GitHubComment[]> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
    });
    
    return response.data.map(comment => ({
      id: comment.id,
      body: comment.body ?? '',
      user: { login: comment.user?.login || 'unknown' },
      created_at: comment.created_at,
    }));
  }

  async addComment(owner: string, repo: string, issueNumber: number, body: string): Promise<GitHubComment> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
    
    return {
      id: response.data.id,
      body: response.data.body ?? '',
      user: { login: response.data.user?.login || 'unknown' },
      created_at: response.data.created_at,
    };
  }

  async createPR(owner: string, repo: string, title: string, body: string, head: string, base: string): Promise<{ url: string; number: number }> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });
    
    return {
      url: response.data.html_url,
      number: response.data.number,
    };
  }

  async getUserRepos(): Promise<{ owner: string; repo: string; fullName: string }[]> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    const response = await this.octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
    });
    
    return response.data.map(repo => ({
      owner: repo.owner.login,
      repo: repo.name,
      fullName: repo.full_name,
    }));
  }
}
