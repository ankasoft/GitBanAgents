import { spawn, type ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import { addComment, type GitHubIssue } from './github';
import { createWorktree, commitChanges, pushBranch, removeWorktree, type GitWorktree } from './git';

export type AgentType = 'claude' | 'opencode' | 'codex';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'timeout';

export interface AgentRun {
  id: string;
  issue: GitHubIssue;
  worktree: GitWorktree | null;
  status: AgentStatus;
  output: string;
  startTime: Date;
  process: ChildProcess | null;
  retryCount: number;
}

export interface AgentConfig {
  type: AgentType;
  repoPath: string;
  owner: string;
  repo: string;
  customArgs?: string;
  timeout?: number;
  retryCount?: number;
  autoPR?: boolean;
  baseBranch?: string;
  pushOnComplete?: boolean;
}

const AGENT_COMMANDS: Record<AgentType, string> = {
  claude: 'claude',
  opencode: 'opencode',
  codex: 'codex'
};

const AGENT_NON_INTERACTIVE_FLAGS: Record<AgentType, string[]> = {
  claude: ['--no-input'],
  opencode: ['--no-confirm'],
  codex: []
};

function generateId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function buildAgentCommand(
  config: AgentConfig,
  worktreePath: string,
  instruction: string
): { cmd: string; args: string[] } {
  const baseCmd = AGENT_COMMANDS[config.type];
  const flags = AGENT_NON_INTERACTIVE_FLAGS[config.type];
  const customArgs = config.customArgs?.split(' ').filter(Boolean) || [];
  
  let cmd = baseCmd;
  let args: string[];
  
  if (config.type === 'claude') {
    args = ['--print', ...flags, ...customArgs, instruction];
  } else if (config.type === 'opencode') {
    args = [...flags, ...customArgs, '--', instruction];
  } else {
    args = [...flags, ...customArgs, instruction];
  }
  
  return { cmd, args };
}

export async function startAgent(
  config: AgentConfig,
  issue: GitHubIssue,
  onOutput: (output: string) => void,
  onStatusChange: (status: AgentStatus) => void
): Promise<AgentRun> {
  const run: AgentRun = {
    id: generateId(),
    issue,
    worktree: null,
    status: 'running',
    output: '',
    startTime: new Date(),
    process: null,
    retryCount: 0
  };
  
  try {
    await addComment(config.owner, config.repo, issue.number, `🤖 Agent started: ${config.type}`);
    
    run.worktree = await createWorktree(config.repoPath, issue.number, issue.title);
    
    const instruction = `Issue #${issue.number}: ${issue.title}\n\n${issue.body || 'No description'}`;
    const { cmd, args } = buildAgentCommand(config, run.worktree.path, instruction);
    
    onOutput(`Starting ${config.type} agent in ${run.worktree.path}\n`);
    onOutput(`Command: ${cmd} ${args.join(' ')}\n\n`);
    
    const child = spawn(cmd, args, {
      cwd: run.worktree.path,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    run.process = child;
    
    const stdout = createInterface({ input: child.stdout! });
    const stderr = createInterface({ input: child.stderr! });
    
    stdout.on('line', (line) => {
      const output = `[stdout] ${line}\n`;
      run.output += output;
      onOutput(output);
    });
    
    stderr.on('line', (line) => {
      const output = `[stderr] ${line}\n`;
      run.output += output;
      onOutput(output);
    });
    
    child.on('close', async (code) => {
      if (code === 0) {
        run.status = 'completed';
        onStatusChange('completed');
        
        try {
          const commitResult = await commitChanges(
            run.worktree!.path,
            issue.number,
            issue.title
          );
          
          const commitMsg = `✅ Agent completed successfully\nCommit: ${commitResult}`;
          run.output += `\n${commitMsg}\n`;
          onOutput(`\n${commitMsg}\n`);
          
          await addComment(config.owner, config.repo, issue.number, commitMsg);
          
          if (config.pushOnComplete) {
            await pushBranch(run.worktree!.path);
            onOutput('Branch pushed to remote\n');
          }
          
          if (config.autoPR) {
            onOutput('Auto-PR creation coming soon...\n');
          }
        } catch (e) {
          const errorMsg = `⚠️ Commit failed: ${e}`;
          run.output += `\n${errorMsg}\n`;
          onOutput(`\n${errorMsg}\n`);
        }
      } else {
        run.status = 'failed';
        onStatusChange('failed');
        
        const errorMsg = `❌ Agent exited with code ${code}`;
        run.output += `\n${errorMsg}\n`;
        onOutput(`\n${errorMsg}\n`);
        
        await addComment(config.owner, config.repo, issue.number, `${errorMsg}\n\nOutput:\n\`\`\`\n${run.output.substring(0, 1000)}\n\`\`\``);
      }
    });
    
    child.on('error', async (err) => {
      run.status = 'failed';
      onStatusChange('failed');
      
      const errorMsg = `❌ Error: ${err.message}`;
      run.output += `\n${errorMsg}\n`;
      onOutput(`\n${errorMsg}\n`);
      
      await addComment(config.owner, config.repo, issue.number, `${errorMsg}\n\nOutput:\n\`\`\`\n${run.output.substring(0, 1000)}\n\`\`\``);
    });
    
    if (config.timeout) {
      setTimeout(() => {
        if (run.status === 'running') {
          run.status = 'timeout';
          onStatusChange('timeout');
          stopAgent(run);
          
          addComment(config.owner, config.repo, issue.number, `⏰ Agent timed out after ${config.timeout}ms`);
        }
      }, config.timeout * 1000);
    }
    
  } catch (e) {
    run.status = 'failed';
    onStatusChange('failed');
    const errorMsg = `❌ Setup error: ${e}`;
    run.output += `\n${errorMsg}\n`;
    onOutput(`\n${errorMsg}\n`);
  }
  
  return run;
}

export function stopAgent(run: AgentRun): void {
  if (run.process) {
    run.process.kill('SIGTERM');
    
    setTimeout(() => {
      if (run.process) {
        run.process.kill('SIGKILL');
      }
    }, 5000);
  }
  
  if (run.worktree) {
    removeWorktree(run.worktree.path, run.worktree.path, run.worktree.branch).catch(console.error);
  }
}
