<script lang="ts">
  import { onMount } from 'svelte';
  import { api, createWebSocket, type GitHubIssue } from './lib/api';
  import { issues, selectedIssue, issueComments, agentOutput, agentStatus, currentSessionId } from './lib/stores/app';
  import { settings, projects, currentProjectId, type Project } from './stores/settings';
  import Board from './components/Kanban/Board.svelte';
  import ProjectColumn from './components/Kanban/ProjectColumn.svelte';
  import SplitView from './components/IssueDetail/SplitView.svelte';
  import Settings from './components/Settings.svelte';
  import NewIssue from './components/NewIssue.svelte';
  
  let showSettings = false;
  let showNewIssue = false;
  let projectIssues = { backlog: 0, doing: 0, review: 0, done: 0 };
  let folderInput: HTMLInputElement;
  
  let ws: WebSocket | null = null;
  
  onMount(() => {
    ws = createWebSocket((msg) => {
      if (msg.type === 'output' && msg.sessionId === $currentSessionId) {
        agentOutput.update(o => o + (msg.output || ''));
      } else if (msg.type === 'close' && msg.sessionId === $currentSessionId) {
        agentStatus.set(msg.exitCode === 0 ? 'completed' : 'failed');
      }
    });
    
    return () => {
      ws?.close();
    };
  });
  
  function handleFolderSelect() {
    folderInput?.click();
  }
  
  async   function handleFolderChosen(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    
    const path = files[0].webkitRelativePath.split('/')[0];
    const fullPath = files[0].path || path;
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: path,
      path: fullPath || path,
      owner: '',
      repo: '',
      agent: 'claude',
      autoPR: false,
      baseBranch: 'main',
      customAgentArgs: '',
      timeout: 1800,
      retryCount: 2,
    };
    
    projects.add(newProject);
    input.value = '';
  }
  
  async function loadIssues(projectId: string) {
    try {
      const data = await api.getIssues(projectId);
      issues.set(data);
      updateIssueCounts();
    } catch (e) {
      console.error('Failed to load issues:', e);
    }
  }
  
  function updateIssueCounts() {
    const counts = { backlog: 0, doing: 0, review: 0, done: 0 };
    const labels = ['backlog', 'doing', 'review', 'done'];
    
    $issues.forEach(issue => {
      const issueLabels = issue.labels.map(l => l.toLowerCase());
      let found = false;
      for (const label of labels) {
        if (issueLabels.includes(label)) {
          counts[label as keyof typeof counts]++;
          found = true;
          break;
        }
      }
      if (!found) counts.backlog++;
    });
    projectIssues = counts;
  }
  
  async function handleProjectSelect(id: string) {
    currentProjectId.set(id);
    await loadIssues(id);
  }
  
  async function handleIssueClick(issue: GitHubIssue) {
    selectedIssue.set(issue);
    try {
      const comments = await api.getComments($currentProjectId!, issue.number);
      issueComments.set(comments);
    } catch (e) {
      console.error('Failed to load comments:', e);
      issueComments.set([]);
    }
  }
  
  async function handleMoveIssue(issue: GitHubIssue, newStatus: string) {
    if (!$currentProjectId) return;
    const newLabels = [...issue.labels.filter(l => !['backlog', 'doing', 'review', 'done'].includes(l.toLowerCase())), newStatus];
    try {
      await api.updateIssue($currentProjectId, issue.number, { labels: newLabels });
      await loadIssues($currentProjectId);
    } catch (e) {
      console.error('Failed to move issue:', e);
    }
  }
  
  async function handleCreateIssue(e: CustomEvent<{ title: string; body: string; labels: string[] }>) {
    if (!$currentProjectId) return;
    try {
      await api.createIssue($currentProjectId, e.detail.title, e.detail.body, e.detail.labels);
      await loadIssues($currentProjectId);
      showNewIssue = false;
    } catch (e) {
      console.error('Failed to create issue:', e);
    }
  }
  
  async function handlePlay(issue: GitHubIssue) {
    if (!$currentProjectId) return;
    selectedIssue.set(issue);
    agentOutput.set('🤖 Agent starting...\n');
    agentStatus.set('running');
    
    try {
      const { sessionId } = await api.startAgent($currentProjectId, issue.number);
      currentSessionId.set(sessionId);
    } catch (e) {
      console.error('Failed to start agent:', e);
      agentStatus.set('failed');
      agentOutput.update(o => o + `\n❌ Error: ${e}\n`);
    }
  }
  
  async function handleStop() {
    if (!$currentSessionId) return;
    try {
      await api.stopAgent($currentSessionId);
      agentStatus.set('failed');
      agentOutput.update(o => o + '\n⏹ Agent stopped by user\n');
    } catch (e) {
      console.error('Failed to stop agent:', e);
    }
  }
  
  async function handleMoveToReview() {
    if (!$selectedIssue || !$currentProjectId) return;
    const newLabels = [...$selectedIssue.labels.filter(l => !['backlog', 'doing', 'review', 'done'].includes(l.toLowerCase())), 'review'];
    try {
      await api.updateIssue($currentProjectId, $selectedIssue.number, { labels: newLabels });
      await loadIssues($currentProjectId);
      handleBack();
    } catch (e) {
      console.error('Failed to move to review:', e);
    }
  }
  
  function handleBack() {
    selectedIssue.set(null);
    issueComments.set([]);
    agentOutput.set('');
    agentStatus.set('idle');
    currentSessionId.set(null);
  }
</script>

<input
  type="file"
  accept="*"
  webkitdirectory
  bind:this={folderInput}
  on:change={handleFolderChosen}
  style="display: none;"
/>

<main data-theme={$settings.theme === 'dark' ? 'dark' : $settings.theme === 'light' ? 'light' : ''}>
  <div class="app">
    <header class="topbar">
      <div class="logo">GitBan Agent</div>
      <div class="repo-info">
        {#if $currentProjectId && $projects.find(p => p.id === $currentProjectId)}
          {$projects.find(p => p.id === $currentProjectId)?.name}
        {/if}
      </div>
      <div class="actions">
        <button class="new-issue-btn" on:click={() => showNewIssue = true}>+ New Issue</button>
        <button class="settings-btn" on:click={() => showSettings = true}>Settings</button>
      </div>
    </header>
    
    <div class="main-content">
      <ProjectColumn
        projects={$projects}
        selectedId={$currentProjectId}
        onSelect={handleProjectSelect}
        onAdd={handleFolderSelect}
      />
      
      {#if $selectedIssue}
        <SplitView
          issue={$selectedIssue}
          comments={$issueComments}
          agentOutput={$agentOutput}
          agentStatus={$agentStatus}
          onBack={handleBack}
          onStop={handleStop}
          onMoveToReview={handleMoveToReview}
        />
      {:else if $currentProjectId}
        <div class="board-container">
          <div class="board-header">
            <button class="refresh-btn" on:click={() => loadIssues($currentProjectId!)}>Refresh</button>
            <div class="issue-counts">
              <span class="count backlog">{projectIssues.backlog} backlog</span>
              <span class="count doing">{projectIssues.doing} doing</span>
              <span class="count review">{projectIssues.review} review</span>
              <span class="count done">{projectIssues.done} done</span>
            </div>
          </div>
          <Board
            issues={$issues}
            onIssueClick={handleIssueClick}
            onPlay={handlePlay}
            onMoveIssue={handleMoveIssue}
          />
        </div>
      {:else}
        <div class="no-project">
          <p>Add a project to get started</p>
        </div>
      {/if}
    </div>
  </div>
  
  {#if showSettings}
    <Settings onClose={() => showSettings = false} />
  {/if}
  
  {#if showNewIssue}
    <NewIssue
      onClose={() => showNewIssue = false}
      on:create={handleCreateIssue}
    />
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    height: 48px;
  }
  
  .logo {
    font-weight: 600;
    font-size: 1rem;
  }
  
  .repo-info {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .new-issue-btn {
    padding: 0.375rem 0.75rem;
    background: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: white;
  }
  
  .settings-btn {
    padding: 0.375rem 0.75rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  .board-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .board-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  
  .refresh-btn {
    padding: 0.25rem 0.75rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .issue-counts {
    display: flex;
    gap: 1rem;
  }
  
  .count {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .count.backlog { background: #64748b; color: white; }
  .count.doing { background: #f59e0b; color: white; }
  .count.review { background: #8b5cf6; color: white; }
  .count.done { background: #22c55e; color: white; }
  
  .loading,
  .no-project {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary, #999);
  }
</style>
