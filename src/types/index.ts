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

export interface GitWorktree {
  path: string;
  branch: string;
  issueNumber: number;
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

export interface AgentConfig {
  worktreePath: string;
  branchName: string;
  agentType: 'claude' | 'opencode' | 'codex';
  instruction: string;
  customArgs?: string;
  timeout?: number;
  onOutput: (output: string) => void;
  onClose: (exitCode: number) => void;
}
