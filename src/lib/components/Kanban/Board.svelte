<script lang="ts">
  import type { GitHubIssue } from '../../services/github';
  import Column from './Column.svelte';
  
  export let issues: GitHubIssue[] = [];
  export let onIssueClick: (issue: GitHubIssue) => void = () => {};
  export let onPlay: (issue: GitHubIssue) => void = () => {};
  
  const COLUMNS = [
    { id: 'backlog', title: 'Backlog', color: '#64748b' },
    { id: 'doing', title: 'Doing', color: '#f59e0b' },
    { id: 'review', title: 'Review', color: '#8b5cf6' },
    { id: 'done', title: 'Done', color: '#22c55e' }
  ];
  
  const STATUS_LABELS = ['backlog', 'doing', 'review', 'done'];
  
  function getIssuesByStatus(status: string): GitHubIssue[] {
    return issues.filter(issue => {
      const hasStatusLabel = issue.labels.some(l => 
        STATUS_LABELS.includes(l.toLowerCase())
      );
      if (!hasStatusLabel && status === 'backlog') {
        return true;
      }
      return issue.labels.some(l => l.toLowerCase() === status);
    });
  }
</script>

<div class="board">
  {#each COLUMNS as column}
    <Column
      title={column.title}
      color={column.color}
      issues={getIssuesByStatus(column.id)}
      {onIssueClick}
      onPlay={column.id === 'backlog' ? onPlay : undefined}
    />
  {/each}
</div>

<style>
  .board {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    height: 100%;
    overflow-x: auto;
  }
</style>
