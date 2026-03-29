const API_BASE = '';

export interface Project {
  id: string;
  name: string;
  path: string;
  owner: string;
  repo: string;
  agentType: 'claude' | 'opencode' | 'codex';
  autoPR: boolean;
  baseBranch: string;
  customAgentArgs: string;
  timeout: number;
  retryCount: number;
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

export interface AgentSession {
  id: string;
  projectId: string;
  issueNumber: number;
  worktreePath: string;
  branchName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
}

export interface ApiError {
  error: string;
}

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().then(err => Promise.reject(err)).catch(() => Promise.reject(new Error(`HTTP ${res.status}`)));
  }
  return res.json();
}

export const api = {
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/api/projects`);
    return handleResponse<Project[]>(res);
  },

  async addProject(data: Omit<Project, 'id'>): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },

  async getIssues(projectId: string): Promise<GitHubIssue[]> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/issues`);
    return handleResponse<GitHubIssue[]>(res);
  },

  async createIssue(projectId: string, title: string, body: string, labels: string[]): Promise<GitHubIssue> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, labels }),
    });
    return handleResponse<GitHubIssue>(res);
  },

  async updateIssue(projectId: string, issueNumber: number, changes: { labels?: string[]; state?: string }): Promise<GitHubIssue> {
    const res = await fetch(`${API_BASE}/api/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    return handleResponse<GitHubIssue>(res);
  },

  async startAgent(projectId: string, issueNumber: number): Promise<{ sessionId: string; worktreePath: string }> {
    const res = await fetch(`${API_BASE}/api/agent/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, issueNumber }),
    });
    return handleResponse<{ sessionId: string; worktreePath: string }>(res);
  },

  async stopAgent(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/agent/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },

  async getComments(projectId: string, issueNumber: number): Promise<GitHubComment[]> {
    const res = await fetch(`${API_BASE}/api/issues/${issueNumber}/comments`);
    return handleResponse<GitHubComment[]>(res);
  },

  async addComment(projectId: string, issueNumber: number, body: string): Promise<GitHubComment> {
    const res = await fetch(`${API_BASE}/api/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    return handleResponse<GitHubComment>(res);
  },
};

export type WsMessage = {
  type: 'output' | 'close' | 'error';
  sessionId: string;
  output?: string;
  exitCode?: number;
  error?: string;
};

export function createWebSocket(onMessage: (msg: WsMessage) => void): WebSocket {
  const ws = new WebSocket(`ws://${window.location.host}/ws`);
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WsMessage;
      onMessage(msg);
    } catch (e) {
      console.error('Invalid WS message:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
