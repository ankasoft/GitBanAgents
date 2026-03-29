import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import type { Issue, Comment } from '../types/index.js';

const ISSUES_DIR = join(homedir(), '.gitban_agent', 'issues');

interface IssueStore {
  issues: Issue[];
  comments: Record<number, Comment[]>;
}

export class IssueService {
  private stores: Map<string, IssueStore> = new Map();

  private getStorePath(projectId: string): string {
    return join(ISSUES_DIR, `${projectId}.json`);
  }

  private loadStore(projectId: string): IssueStore {
    if (this.stores.has(projectId)) {
      return this.stores.get(projectId)!;
    }

    const path = this.getStorePath(projectId);
    let store: IssueStore;

    try {
      if (existsSync(path)) {
        store = JSON.parse(readFileSync(path, 'utf-8'));
      } else {
        store = { issues: [], comments: {} };
      }
    } catch (e) {
      console.error(`Failed to load issue store for ${projectId}:`, e);
      store = { issues: [], comments: {} };
    }

    this.stores.set(projectId, store);
    return store;
  }

  private saveStore(projectId: string, store: IssueStore): void {
    try {
      if (!existsSync(ISSUES_DIR)) {
        mkdirSync(ISSUES_DIR, { recursive: true });
      }
      writeFileSync(this.getStorePath(projectId), JSON.stringify(store, null, 2));
    } catch (e) {
      console.error(`Failed to save issue store for ${projectId}:`, e);
    }
  }

  private generateId(): number {
    return Date.now() ^ (Math.random() * 0xFFFFFFFF);
  }

  getIssues(projectId: string): Issue[] {
    const store = this.loadStore(projectId);
    return store.issues;
  }

  getIssue(projectId: string, number: number): Issue | undefined {
    const store = this.loadStore(projectId);
    return store.issues.find(i => i.number === number);
  }

  createIssue(projectId: string, title: string, body: string, labels: string[] = []): Issue {
    const store = this.loadStore(projectId);
    
    const maxNumber = store.issues.reduce((max, i) => Math.max(max, i.number), 0);
    const issue: Issue = {
      number: maxNumber + 1,
      title,
      body,
      state: 'open',
      labels,
      assignees: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comments: 0,
      url: `gitban://issue/${projectId}/${maxNumber + 1}`,
    };

    store.issues.push(issue);
    store.comments[issue.number] = [];
    this.saveStore(projectId, store);
    
    return issue;
  }

  updateIssue(projectId: string, number: number, changes: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
  }): Issue | undefined {
    const store = this.loadStore(projectId);
    const issue = store.issues.find(i => i.number === number);
    
    if (!issue) return undefined;

    if (changes.title !== undefined) issue.title = changes.title;
    if (changes.body !== undefined) issue.body = changes.body;
    if (changes.state !== undefined) issue.state = changes.state;
    if (changes.labels !== undefined) issue.labels = changes.labels;
    issue.updated_at = new Date().toISOString();

    this.saveStore(projectId, store);
    return issue;
  }

  deleteIssue(projectId: string, number: number): boolean {
    const store = this.loadStore(projectId);
    const idx = store.issues.findIndex(i => i.number === number);
    
    if (idx === -1) return false;

    store.issues.splice(idx, 1);
    delete store.comments[number];
    this.saveStore(projectId, store);
    return true;
  }

  getComments(projectId: string, issueNumber: number): Comment[] {
    const store = this.loadStore(projectId);
    return store.comments[issueNumber] || [];
  }

  addComment(projectId: string, issueNumber: number, body: string): Comment | undefined {
    const store = this.loadStore(projectId);
    const issue = store.issues.find(i => i.number === issueNumber);
    
    if (!issue) return undefined;

    const comment: Comment = {
      id: this.generateId(),
      body,
      user: { login: 'user' },
      created_at: new Date().toISOString(),
    };

    if (!store.comments[issueNumber]) {
      store.comments[issueNumber] = [];
    }
    store.comments[issueNumber].push(comment);
    issue.comments = store.comments[issueNumber].length;
    issue.updated_at = new Date().toISOString();

    this.saveStore(projectId, store);
    return comment;
  }

  moveIssue(projectId: string, issueNumber: number, newState: 'backlog' | 'doing' | 'review' | 'done'): Issue | undefined {
    const store = this.loadStore(projectId);
    const issue = store.issues.find(i => i.number === issueNumber);
    
    if (!issue) return undefined;

    issue.labels = issue.labels.filter(l => !['backlog', 'doing', 'review', 'done'].includes(l));
    
    if (newState !== 'backlog') {
      issue.labels.push(newState);
    }
    
    issue.updated_at = new Date().toISOString();
    this.saveStore(projectId, store);
    return issue;
  }

  importFromGitHub(projectId: string, issues: Issue[]): void {
    const store = this.loadStore(projectId);
    store.issues = issues;
    store.comments = {};
    this.saveStore(projectId, store);
  }
}