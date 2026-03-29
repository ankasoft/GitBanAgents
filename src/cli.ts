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
import { GitHubService } from './services/github.js';
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
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true });
}

async function main() {
  const options = parseCliOptions();
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  
  const storage = new StorageService();
  const github = new GitHubService();
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
  
  app.post('/api/projects', (req, res) => {
    const { name, path, owner, repo, agentType } = req.body;
    const project = storage.addProject({ name, path, owner, repo, agentType });
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
    try {
      const issues = await github.getIssues(project.owner, project.repo);
      res.json(issues);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  app.post('/api/agent/start', async (req, res) => {
    const { projectId, issueNumber } = req.body;
    const project = storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    try {
      const issue = await github.getIssue(project.owner, project.repo, issueNumber);
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
