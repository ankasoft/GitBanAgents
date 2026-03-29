#!/usr/bin/env node

import { spawn } from 'child_process';
import { createServer } from 'http';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { AgentService } from './services/agent.js';
import { IssueService } from './services/issues.js';
import { GitService } from './services/git.js';
import { StorageService } from './services/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '127.0.0.1';

interface CliOptions {
  port: number;
  host: string;
  open: boolean;
}

function parseCliOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      port: { type: 'string', default: String(DEFAULT_PORT) },
      host: { type: 'string', default: DEFAULT_HOST },
      open: { type: 'boolean', default: true },
    },
  });

  return {
    port: parseInt(values.port as string, 10) || DEFAULT_PORT,
    host: values.host as string || DEFAULT_HOST,
    open: values.open as boolean,
  };
}

function openBrowser(url: string): void {
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', url], { stdio: 'ignore', detached: true });
  } else if (platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true });
  } else {
    spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
  }
}

async function main() {
  const options = parseCliOptions();
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  
  const storage = new StorageService();
  const issues = new IssueService();
  const git = new GitService();
  const agent = new AgentService();

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log('Received:', msg);
      } catch (e) {
        console.error('Invalid message:', e);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  app.get('/api/projects', (req, res) => {
    const projects = storage.getProjects();
    res.json(projects);
  });
  
  app.post('/api/projects', async (req, res) => {
    const { name, path, agentType } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const resolvedPath = git.resolveRepoPath(path);
    const isGit = await git.isGitRepo(resolvedPath);
    if (!isGit) {
      return res.status(400).json({ error: 'Selected folder is not a git repository. Please run "git init" first.' });
    }
    
    const repoInfo = await git.getRepoInfo(resolvedPath);
    
    const project = storage.addProject({ 
      name: name || resolvedPath.split(/[/\\]/).pop() || 'Project', 
      path: resolvedPath, 
      owner: repoInfo?.owner || '',
      repo: repoInfo?.repo || '',
      agentType: agentType || 'claude',
      autoPR: false,
      baseBranch: repoInfo?.branch || 'main',
      customAgentArgs: '',
      timeout: 1800,
      retryCount: 2,
    });
    res.json(project);
  });
  
  app.delete('/api/projects/:id', (req, res) => {
    storage.deleteProject(req.params.id);
    res.json({ success: true });
  });
  
  app.get('/api/projects/:id/issues', async (req, res) => {
    const project = storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const ghIssues = await git.getGitHubIssues(project.path);
    res.json(ghIssues);
  });
  
  app.post('/api/projects/:id/issues', async (req, res) => {
    const project = storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { title, body, labels } = req.body;
    const issue = await git.createGitHubIssue(project.path, title, body || '', labels || []);
    if (!issue) {
      return res.status(500).json({ error: 'Failed to create GitHub issue. Make sure gh CLI is authenticated.' });
    }
    res.json(issue);
  });
  
  app.patch('/api/issues/:projectId/:issueNumber', (req, res) => {
    const { projectId, issueNumber } = req.params;
    const issueNum = parseInt(issueNumber, 10);
    const changes = req.body;
    
    if (changes.state && ['backlog', 'doing', 'review', 'done'].includes(changes.state)) {
      const issue = issues.moveIssue(projectId, issueNum, changes.state);
      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      return res.json(issue);
    }
    
    const issue = issues.updateIssue(projectId, issueNum, changes);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  });
  
  app.get('/api/issues/:projectId/:issueNumber/comments', (req, res) => {
    const { projectId, issueNumber } = req.params;
    const comments = issues.getComments(projectId, parseInt(issueNumber, 10));
    res.json(comments);
  });
  
  app.post('/api/issues/:projectId/:issueNumber/comments', (req, res) => {
    const { projectId, issueNumber } = req.params;
    const { body } = req.body;
    const comment = issues.addComment(projectId, parseInt(issueNumber, 10), body);
    if (!comment) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(comment);
  });
  
  app.post('/api/agent/start', async (req, res) => {
    const { projectId, issueNumber } = req.body;
    const project = storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    try {
      const issue = issues.getIssue(projectId, issueNumber);
      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      
      const worktree = await git.createWorktree(project.path, issueNumber, issue.title);
      
      const sessionId = await agent.start({
        worktreePath: worktree.path,
        branchName: worktree.branch,
        agentType: project.agentType,
        instruction: `Issue #${issueNumber}: ${issue.title}\n\n${issue.body || 'No description'}`,
        onOutput: (output) => {
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: 'output', sessionId, output }));
            }
          });
        },
        onClose: (exitCode) => {
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: 'close', sessionId, exitCode }));
            }
          });
        },
      });
      
      res.json({ sessionId, worktreePath: worktree.path });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  app.post('/api/agent/stop', (req, res) => {
    const { sessionId } = req.body;
    agent.stop(sessionId);
    res.json({ success: true });
  });
  
  server.listen(options.port, options.host, () => {
    const url = `http://${options.host}:${options.port}`;
    console.log(`GitBan Agent server running at ${url}`);
    
    if (options.open) {
      openBrowser(url);
    }
    
    console.log('Press Ctrl+C to stop');
  });
  
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    agent.stopAll();
    server.close(() => {
      process.exit(0);
    });
  });
}

main().catch(console.error);