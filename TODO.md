# Fullstack Monorepo - GitBan Agent

## Proje Yapısı

```
gitban_agent/
├── web-ui/                 # Frontend (Svelte + Vite)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/     # UI components
│   │   │   ├── stores/         # Svelte stores
│   │   │   └── types/          # TypeScript types
│   │   ├── App.svelte
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
├── src/                    # Backend (Node.js)
│   ├── cli.ts              # CLI entry point
│   ├── server/             # HTTP + WebSocket server
│   │   ├── index.ts        # Server bootstrap
│   │   ├── routes/         # REST API routes
│   │   │   ├── projects.ts
│   │   │   ├── issues.ts
│   │   │   └── agents.ts
│   │   ├── ws/             # WebSocket handlers
│   │   │   └── terminal.ts
│   │   └── middleware/
│   ├── services/           # Business logic
│   │   ├── github.ts       # GitHub API (Octokit)
│   │   ├── git.ts          # Git worktree/branch
│   │   ├── agent.ts        # Agent execution (node-pty)
│   │   └── storage.ts      # Local storage
│   └── types/              # Shared types
├── package.json            # Workspace root
├── tsconfig.base.json
└── README.md
```

---

## 1. Proje Kurulumu

### 1.1 Workspace Yapısı
- [ ] Root `package.json` (workspaces: ["web-ui", "src"])
- [ ] `tsconfig.base.json` (shared compiler options)
- [ ] `tsconfig.json` for src (Node.js target)
- [ ] `tsconfig.json` for web-ui (browser target)

### 1.2 Backend Paketleri
- [ ] `express` - HTTP server
- [ ] `ws` - WebSocket
- [ ] `node-pty` - Terminal process (PTY)
- [ ] `@octokit/rest` - GitHub API
- [ ] `zod` - Validation
- [ ] `cors` - CORS middleware
- [ ] `@types/*` - TypeScript types

### 1.3 Web-UI Paketleri
- [ ] `svelte` + `@sveltejs/vite-plugin-svelte`
- [ ] `vite`
- [ ] WebSocket client (native browser WS)

---

## 2. CLI Entry Point

### 2.1 Komut Satırı Arayüzü
- [ ] Commander.js ile CLI parser
- [ ] `npx gitban_agent` komutu
- [ ] `--port` opsiyonu (default: 3000)
- [ ] `--no-open` opsiyonu
- [ ] `--host` opsiyonu

### 2.2 Browser Açma
- [ ] Platform bazlı browser açma (open/xdg-open/start)
- [ ] Otomatik port bulma (EADDRINUSE durumunda)

---

## 3. Server (Backend)

### 3.1 HTTP Server
- [ ] Express server bootstrap
- [ ] CORS ayarları
- [ ] JSON middleware
- [ ] Health check endpoint (`GET /health`)

### 3.2 WebSocket Server
- [ ] WebSocket upgrade handling
- [ ] Terminal session management
- [ ] Real-time output streaming

### 3.3 REST API

#### Projects
- [ ] `GET /api/projects` - Proje listesi
- [ ] `POST /api/projects` - Yeni proje ekle
- [ ] `DELETE /api/projects/:id` - Proje sil
- [ ] `PATCH /api/projects/:id` - Proje güncelle

#### Issues
- [ ] `GET /api/projects/:id/issues` - Issue listesi
- [ ] `POST /api/projects/:id/issues` - Issue oluştur
- [ ] `PATCH /api/issues/:number` - Issue güncelle (label, status)
- [ ] `GET /api/issues/:number/comments` - Yorumlar
- [ ] `POST /api/issues/:number/comments` - Yorum ekle

#### Agents
- [ ] `POST /api/agent/start` - Agent başlat
  - Body: `{ projectId, issueNumber, agentType }`
  - Response: `{ sessionId, worktreePath }`
- [ ] `POST /api/agent/stop` - Agent durdur
  - Body: `{ sessionId }`
- [ ] `GET /api/agent/status/:sessionId` - Agent durumu
- [ ] `POST /api/agent/retry` - Retry

---

## 4. Agent Service (node-pty)

### 4.1 Terminal Session
- [ ] `node-pty` spawn
- [ ] PTY shell açma
- [ ] stdin/stdout/stderr stream
- [ ] Session tracking (Map<sessionId, PTY>)

### 4.2 Agent Çalıştırma
- [ ] Claude Code: `claude --print --no-input {instruction}`
- [ ] Opencode: `opencode --no-confirm {instruction}`
- [ ] Environment variables
- [ ] Working directory: worktree path

### 4.3 Output Streaming
- [ ] WebSocket'e PTY output gönderme
- [ ] Terminal resize events
- [ ] Heartbeat/keepalive

---

## 5. Git Service

### 5.1 Worktree Yönetimi
- [ ] Worktree oluşturma
- [ ] Worktree silme
- [ ] Branch oluşturma/silme
- [ ] `git worktree list` parse

### 5.2 Commit & Push
- [ ] `git add -A && git commit`
- [ ] `git push`
- [ ] Commit message template: `feat(#issue): title`

### 5.3 Branch Koruma
- [ ] Ana branch kontrolü (main/master)
- [ ] `.gitban_agent/` ignore

---

## 6. Local Issue Storage

**Note:** We discovered that cline/kanban doesn't require a GitHub token - agents (Claude Code, Opencode) handle GitHub authentication themselves. Therefore, we store issues locally in JSON files and let agents handle all GitHub operations via CLI.

### 6.1 Issue Store (`~/.gitban_agent/issues/`)
- [x] Local JSON-based issue storage
- [x] Issue CRUD operations
- [x] Comment support
- [x] Label management (backlog, doing, review, done)

### 6.2 Agent Integration
- [x] Agents use their own GitHub credentials
- [x] Worktree-based agent execution
- [ ] Agents can read/write issues via `gh issue` CLI

---

## 7. Web-UI (Frontend)

### 7.1 Proje Listesi
- [ ] Sol kolonda proje kartları
- [ ] Issue metrikleri (backlog/doing/review/done sayıları)
- [ ] Proje ekleme butonu
- [ ] Proje seçimi

### 7.2 Kanban Board
- [ ] 5 kolon (Projects, Backlog, Doing, Review, Done)
- [ ] Issue kartları
- [ ] Drag-and-drop (sürükle-bırak)
- [ ] Kolonlar arası taşıma

### 7.3 Issue Detay (Split View)
- [ ] Sol panel (1/4): Issue içeriği
  - Başlık, body, labels
  - Yorumlar listesi
  - Geri butonu
- [ ] Sağ panel (3/5): Terminal
  - Real-time output
  - Durum göstergesi
  - Durdur/Review butonları

### 7.4 Settings
- [ ] Tema seçimi (light/dark/system)
- [ ] Dil seçimi (tr/en)
- [ ] Agent varsayılanları
- [ ] Bildirim ayarları

### 7.5 WebSocket Client
- [ ] Terminal output subscribe
- [ ] Agent status updates
- [ ] Reconnection handling

---

## 8. Shared Types

### 8.1 API Contract
- [ ] Request/Response types
- [ ] WebSocket message types
- [ ] Validation schemas (Zod)

### 8.2 Domain Types
- [ ] Project
- [ ] Issue
- [ ] Agent
- [ ] TerminalSession

---

## 9. Build & Deploy

### 9.1 Build Scripts
- [ ] `npm run build` - Tümünü build et
- [ ] `npm run dev` - Development mode
- [ ] `npm run dev:server` - Sadece server
- [ ] `npm run dev:web` - Sadece web-ui

### 9.2 Production
- [ ] esbuild ile server bundle
- [ ] Vite build for web-ui
- [ ] Single CLI entry point

---

## 10. npm Publish

### 10.1 Package.json
- [ ] `bin: gitban_agent`
- [ ] `files`: dist, web-ui/dist
- [ ] `engines`: node >= 20

### 10.2 README
- [ ] Kurulum
- [ ] Kullanım
- [ ] Screenshots

---

## Öncelik Sırası

### P0 - MVP
1. Workspace kurulumu
2. CLI + Server bootstrap
3. WebSocket terminal streaming
4. Agent execution (node-pty)
5. GitHub API entegrasyonu
6. Kanban board UI
7. Issue detay split view

### P1 - Important
1. Worktree management
2. Auto-commit on complete
3. PR creation
4. Settings panel
5. Theme/Language

### P2 - Nice to Have
1. Keyboard shortcuts
2. Search/filter
3. Notification system
4. Agent retry logic
