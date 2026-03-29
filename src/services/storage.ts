import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import type { Project } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.gitban_agent');
const CONFIG_FILE = join(CONFIG_DIR, 'projects.json');

export class StorageService {
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }
      
      if (existsSync(CONFIG_FILE)) {
        const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
        this.projects = new Map(Object.entries(data));
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }

  private save(): void {
    try {
      const data = Object.fromEntries(this.projects);
      writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to save projects:', e);
    }
  }

  getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  addProject(data: Omit<Project, 'id'>): Project {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const project: Project = {
      id,
      ...data,
      autoPR: false,
      baseBranch: 'main',
      customAgentArgs: '',
      timeout: 1800,
      retryCount: 2,
    };
    this.projects.set(id, project);
    this.save();
    return project;
  }

  updateProject(id: string, changes: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updated = { ...project, ...changes };
    this.projects.set(id, updated);
    this.save();
    return updated;
  }

  deleteProject(id: string): void {
    this.projects.delete(id);
    this.save();
  }

  getGithubToken(): string | null {
    const tokenFile = join(CONFIG_DIR, 'token');
    if (existsSync(tokenFile)) {
      return readFileSync(tokenFile, 'utf-8').trim();
    }
    return null;
  }

  setGithubToken(token: string): void {
    writeFileSync(join(CONFIG_DIR, 'token'), token);
  }
}
