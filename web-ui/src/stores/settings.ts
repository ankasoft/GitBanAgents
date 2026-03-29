import { writable } from 'svelte/store';

export interface Project {
  id: string;
  name: string;
  path: string;
  owner: string;
  repo: string;
  agent: 'claude' | 'opencode' | 'codex';
  autoPR: boolean;
  baseBranch: string;
  customAgentArgs: string;
  timeout: number;
  retryCount: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'tr' | 'en';
  defaultAgent: 'claude' | 'opencode' | 'codex';
  pushOnComplete: boolean;
  notifications: boolean;
  branchProtection: boolean;
}

const defaultSettings: Settings = {
  theme: 'system',
  language: 'tr',
  defaultAgent: 'claude',
  pushOnComplete: false,
  notifications: true,
  branchProtection: true
};

function createSettingsStore() {
  const stored = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('gitban_settings')
    : null;
  const initial: Settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  
  const { subscribe, set, update } = writable<Settings>(initial);

  return {
    subscribe,
    set: (value: Settings) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gitban_settings', JSON.stringify(value));
      }
      set(value);
    },
    update: (fn: (settings: Settings) => Settings) => {
      update(settings => {
        const newSettings = fn(settings);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gitban_settings', JSON.stringify(newSettings));
        }
        return newSettings;
      });
    }
  };
}

function createProjectsStore() {
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('gitban_projects')
    : null;
  const initial: Project[] = stored ? JSON.parse(stored) : [];
  
  const { subscribe, set, update } = writable<Project[]>(initial);

  return {
    subscribe,
    add: (project: Project) => {
      update(projects => {
        const newProjects = [...projects, project];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gitban_projects', JSON.stringify(newProjects));
        }
        return newProjects;
      });
    },
    remove: (id: string) => {
      update(projects => {
        const newProjects = projects.filter(p => p.id !== id);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gitban_projects', JSON.stringify(newProjects));
        }
        return newProjects;
      });
    },
    update: (id: string, changes: Partial<Project>) => {
      update(projects => {
        const newProjects = projects.map(p => p.id === id ? { ...p, ...changes } : p);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gitban_projects', JSON.stringify(newProjects));
        }
        return newProjects;
      });
    },
    set
  };
}

export const settings = createSettingsStore();
export const projects = createProjectsStore();
export const currentProjectId = writable<string | null>(null);
export const githubToken = writable<string | null>(null);
