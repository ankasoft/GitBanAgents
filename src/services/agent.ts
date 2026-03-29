import * as pty from 'node-pty';
import type { AgentConfig, AgentSession } from '../types/index.js';

const AGENT_COMMANDS: Record<string, string[]> = {
  claude: ['claude', '--print', '--no-input'],
  opencode: ['opencode', '--no-confirm'],
  codex: ['codex'],
};

export class AgentService {
  private sessions: Map<string, AgentSession & { pty: pty.IPty }> = new Map();

  async start(config: AgentConfig): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const args = AGENT_COMMANDS[config.agentType] || AGENT_COMMANDS.claude;
    
    if (config.customArgs) {
      args.push(...config.customArgs.split(' ').filter(Boolean));
    }
    
    args.push('--', config.instruction);
    
    console.log(`Starting agent: ${args.join(' ')} in ${config.worktreePath}`);
    
    const ptyProcess = pty.spawn(args[0], args.slice(1), {
      cwd: config.worktreePath,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      } as Record<string, string>,
    });
    
    const session: AgentSession & { pty: pty.IPty } = {
      id: sessionId,
      projectId: '',
      issueNumber: 0,
      worktreePath: config.worktreePath,
      branchName: config.branchName,
      status: 'running',
      startedAt: new Date(),
      pty: ptyProcess,
    };
    
    this.sessions.set(sessionId, session);
    
    ptyProcess.onData((data: string) => {
      config.onOutput(data);
    });
    
    ptyProcess.onExit(({ exitCode }) => {
      session.status = exitCode === 0 ? 'completed' : 'failed';
      config.onClose(exitCode || 0);
      this.sessions.delete(sessionId);
    });
    
    if (config.timeout) {
      setTimeout(() => {
        if (this.sessions.has(sessionId)) {
          ptyProcess.kill();
        }
      }, config.timeout * 1000);
    }
    
    return sessionId;
  }

  stop(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.kill();
      this.sessions.delete(sessionId);
    }
  }

  stopAll(): void {
    for (const session of this.sessions.values()) {
      session.pty.kill();
    }
    this.sessions.clear();
  }

  getSession(sessionId: string): AgentSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    return {
      id: session.id,
      projectId: session.projectId,
      issueNumber: session.issueNumber,
      worktreePath: session.worktreePath,
      branchName: session.branchName,
      status: session.status,
      startedAt: session.startedAt,
    };
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.resize(cols, rows);
    }
  }
}
