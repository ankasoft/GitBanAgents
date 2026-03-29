import { writable } from 'svelte/store';
import type { Project, GitHubIssue, GitHubComment } from '../api';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'tr' | 'en';
  notifications: boolean;
}

export const projects = writable<Project[]>([]);
export const currentProjectId = writable<string | null>(null);
export const issues = writable<GitHubIssue[]>([]);
export const selectedIssue = writable<GitHubIssue | null>(null);
export const issueComments = writable<GitHubComment[]>([]);
export const settings = writable<Settings>({
  theme: 'system',
  language: 'tr',
  notifications: true,
});

export const agentOutput = writable<string>('');
export const agentStatus = writable<'idle' | 'running' | 'completed' | 'failed'>('idle');
export const currentSessionId = writable<string | null>(null);
