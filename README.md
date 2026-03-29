# GitBan Agent

A visual Kanban board for managing AI coding agents (Claude Code, Opencode, Codex) via GitHub Issues. Agents run in isolated Git worktrees, keeping your main repository clean while enabling parallel task execution.

## Features

- **5-Column Kanban Board** - Projects, Backlog, Doing, Review, Done
- **Agent Management** - Launch and monitor Claude Code, Opencode, or Codex agents
- **Git Worktree Isolation** - Each issue gets its own branch and worktree
- **Split-View Terminal** - Real-time agent output alongside issue details
- **Local Storage** - Issues stored locally in JSON; agents handle GitHub via CLI
- **No GitHub Token Required** - Agents authenticate with their own credentials

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitBan Agent                         │
├─────────────────────┬───────────────────────────────────┤
│   Svelte Frontend   │        Express Backend           │
│   (Port 5173)       │         (Port 3000)               │
│                     │                                   │
│  ┌───────────────┐  │  ┌─────────┐  ┌───────────────┐  │
│  │  Kanban Board │◄─┼─►│  REST   │  │  WebSocket    │  │
│  └───────────────┘  │  │  API    │  │  Terminal     │  │
│                     │  └─────────┘  └───────────────┘  │
│  ┌───────────────┐  │         │              │          │
│  │ Issue Detail  │  │  ┌──────▼──────┐ ┌────▼────┐    │
│  │  + Terminal   │  │  │ Issue Store │ │ Git Svc  │    │
│  └───────────────┘  │  │ (Local JSON) │ │ Worktree │    │
└─────────────────────┴──┴──────────────┴─┴──────────┴────┘
                                                      │
                              ┌────────────────────────┘
                              ▼
                     ┌────────────────┐
                     │  AI  Agents    │
                     │  Claude Code   │
                     │  Opencode      │
                     │  Codex         │
                     └────────────────┘
```

## Tech Stack

- **Frontend**: Svelte 5, Vite
- **Backend**: Express, WebSocket, node-pty
- **Storage**: Local JSON files (`~/.gitban_agent/issues/`)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ankasoft/GitBanAgents.git
cd GitBanAgents

# Install dependencies
npm install

# Start development servers (backend + frontend)
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

### 1. Create a Project
Click **New Project** and select a local Git repository.

### 2. Create Issues
Add tasks to the Backlog column. Each issue represents a task for an AI agent.

### 3. Launch an Agent
- Click **Start Agent** on any issue
- Select agent type (Claude Code, Opencode, or Codex)
- The agent runs in an isolated Git worktree
- Monitor progress in the split-view terminal

### 4. Track Progress
Drag issues between columns. When an agent completes, move the issue to **Done**.

## How It Works

1. **Issue Creation** - Issues are stored locally in `~/.gitban_agent/issues/{projectId}.json`
2. **Worktree Allocation** - When an agent starts, a new Git worktree + branch is created
3. **Agent Execution** - The selected agent runs in the worktree directory via node-pty
4. **Real-time Output** - Terminal I/O streams to the browser via WebSocket
5. **GitHub Integration** - Agents use their own GitHub CLI credentials (`gh auth`)

## Project Structure

```
gitban_agent/
├── web-ui/                    # Svelte frontend
│   └── src/
│       ├── App.svelte
│       ├── components/        # Kanban, IssueDetail, Settings
│       └── lib/               # API client, stores
├── src/                       # Express backend
│   ├── cli.ts                 # Entry point
│   ├── server/               # HTTP + WebSocket server
│   └── services/            # Git, Agent, Issue storage
├── package.json              # Workspace root
└── tsconfig.base.json
```

## Configuration

Backend runs on port **3000**, frontend on **5173**. Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Backend server port |
| `HOST` | 127.0.0.1 | Backend host binding |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New issue |
| `1-5` | Switch to column |
| `E` | Edit selected issue |
| `Enter` | Open issue detail |
| `Esc` | Close modal/panel |

## Development

```bash
# Run both servers
npm run dev

# Run only backend
npm run dev:server

# Run only frontend
npm run dev:web

# Build for production
npm run build

# Start production server
npm start
```

## Requirements

- Node.js >= 20
- Git
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) / [Opencode](https://opencode.ai) / [Codex](https://openai.com/index/introducing-codex) (optional, for agent execution)

## Contributing

Contributions are welcome! Please open an issue first for major changes.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

---

Built with ❤️ for developers who love Kanban + AI agents
