<script lang="ts">
  import { githubToken, settings, projects, currentProjectId, type Project } from './lib/stores/settings';
  import { getIssues, getComments, createIssue, updateIssue, type GitHubIssue, type GitHubComment } from './lib/services/github';
  import Setup from './lib/components/Setup.svelte';
  import Board from './lib/components/Kanban/Board.svelte';
  import ProjectColumn from './lib/components/Kanban/ProjectColumn.svelte';
  import SplitView from './lib/components/IssueDetail/SplitView.svelte';
  import Settings from './lib/components/Settings.svelte';
  import NewIssue from './lib/components/NewIssue.svelte';
  
  let showSetup = true;
  let showSettings = false;
  let showNewIssue = false;
  let selectedIssue: GitHubIssue | null = null;
  let issueComments: GitHubComment[] = [];
  let issues: GitHubIssue[] = [];
  let agentOutput = '';
  let agentStatus: 'idle' | 'running' | 'completed' | 'failed' = 'idle';
  
  let currentProject: Project | null = null;
  let projectIssues = { backlog: 0, doing: 0, review: 0, done: 0 };
  
  githubToken.subscribe(token => {
    showSetup = !token;
  });
  
  projects.subscribe(list => {
    currentProjectId.subscribe(id => {
      if (id && list.length > 0) {
        currentProject = list.find(p => p.id === id) || null;
        if (currentProject) {
          loadIssues();
        }
      }
    })();
  });
  
  async function loadIssues() {
    if (!currentProject) return;
    try {
      issues = await getIssues(currentProject.owner, currentProject.repo);
      updateIssueCounts();
    } catch (e) {
      console.error('Failed to load issues:', e);
    }
  }
  
  function updateIssueCounts() {
    const counts = { backlog: 0, doing: 0, review: 0, done: 0 };
    const labels = ['backlog', 'doing', 'review', 'done'];
    
    issues.forEach(issue => {
      const issueLabels = issue.labels.map(l => l.toLowerCase());
      let found = false;
      for (const label of labels) {
        if (issueLabels.includes(label)) {
          counts[label as keyof typeof counts]++;
          found = true;
          break;
        }
      }
      if (!found) {
        counts.backlog++;
      }
    });
    projectIssues = counts;
  }
  
  async function handleIssueClick(issue: GitHubIssue) {
    if (!currentProject) return;
    selectedIssue = issue;
    try {
      issueComments = await getComments(currentProject.owner, currentProject.repo, issue.number);
    } catch (e) {
      console.error('Failed to load comments:', e);
      issueComments = [];
    }
  }
  
  async function handleCreateIssue(e: CustomEvent<{ title: string; body: string; labels: string[] }>) {
    if (!currentProject) return;
    try {
      await createIssue(currentProject.owner, currentProject.repo, e.detail.title, e.detail.body, e.detail.labels);
      await loadIssues();
    } catch (e) {
      console.error('Failed to create issue:', e);
    }
  }
  
  async function handleMoveIssue(issue: GitHubIssue, newStatus: string) {
    if (!currentProject) return;
    const oldLabels = issue.labels;
    const newLabels = [...oldLabels.filter(l => !['backlog', 'doing', 'review', 'done'].includes(l.toLowerCase())), newStatus];
    
    try {
      await updateIssue(currentProject.owner, currentProject.repo, issue.number, { labels: newLabels });
      await loadIssues();
    } catch (e) {
      console.error('Failed to move issue:', e);
    }
  }
  
  function handleBack() {
    selectedIssue = null;
    issueComments = [];
    agentOutput = '';
    agentStatus = 'idle';
  }
  
  function handlePlay(issue: GitHubIssue) {
    console.log('Play agent for issue:', issue.number);
    selectedIssue = issue;
    agentStatus = 'running';
    agentOutput = '🤖 Agent started...\n';
  }
  
  function handleStop() {
    agentStatus = 'failed';
    agentOutput += '\n⏹ Agent stopped by user';
  }
  
  async function handleMoveToReview() {
    if (selectedIssue && currentProject) {
      await handleMoveIssue(selectedIssue, 'review');
    }
    handleBack();
  }
  
  function handleProjectSelect(id: string) {
    currentProjectId.set(id);
  }
  
  function handleAddProject() {
    console.log('Add project');
  }
</script>

<main data-theme={$settings.theme === 'dark' ? 'dark' : $settings.theme === 'light' ? 'light' : ''}>
  {#if showSetup}
    <Setup />
  {:else}
    <div class="app">
      <header class="topbar">
        <div class="logo">GitBan Agent</div>
        <div class="repo-info">
          {#if currentProject}
            {currentProject.owner}/{currentProject.repo}
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
          onAdd={handleAddProject}
        />
        
        {#if selectedIssue}
          <SplitView
            issue={selectedIssue}
            comments={issueComments}
            {agentOutput}
            {agentStatus}
            onBack={handleBack}
            onStop={handleStop}
            onMoveToReview={handleMoveToReview}
          />
        {:else}
          <div class="board-container">
            {#if currentProject}
              <div class="board-header">
                <button class="refresh-btn" on:click={loadIssues}>Refresh</button>
                <div class="issue-counts">
                  <span class="count backlog">{projectIssues.backlog} backlog</span>
                  <span class="count doing">{projectIssues.doing} doing</span>
                  <span class="count review">{projectIssues.review} review</span>
                  <span class="count done">{projectIssues.done} done</span>
                </div>
              </div>
              <Board
                {issues}
                onIssueClick={handleIssueClick}
                onPlay={handlePlay}
                onMoveIssue={handleMoveIssue}
              />
            {:else}
              <div class="no-project">
                <p>Select or add a project to get started</p>
              </div>
            {/if}
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
  
  .new-issue-btn:hover {
    opacity: 0.9;
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
  
  .settings-btn:hover {
    background: var(--color-border);
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
  
  .refresh-btn:hover {
    opacity: 0.9;
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
  
  .no-project {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary, #999);
  }
</style>
