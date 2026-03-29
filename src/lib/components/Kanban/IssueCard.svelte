<script lang="ts">
  import type { GitHubIssue } from '../../services/github';
  
  export let issue: GitHubIssue;
  export let onClick: () => void = () => {};
  
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }
</script>

<button class="issue-card" on:click={onClick}>
  <div class="header">
    <span class="number">#{issue.number}</span>
    <span class="date">{formatDate(issue.updated_at)}</span>
  </div>
  <h3 class="title">{issue.title}</h3>
  {#if issue.labels.length > 0}
    <div class="labels">
      {#each issue.labels.slice(0, 3) as label}
        <span class="label">{label}</span>
      {/each}
    </div>
  {/if}
  {#if issue.comments > 0}
    <div class="comments">
      💬 {issue.comments}
    </div>
  {/if}
</button>

<style>
  .issue-card {
    display: block;
    width: 100%;
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: box-shadow 0.2s, transform 0.2s;
    margin-bottom: 0.5rem;
  }
  
  .issue-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.375rem;
  }
  
  .number {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    font-weight: 500;
  }
  
  .date {
    font-size: 0.7rem;
    color: var(--color-text-secondary, #999);
  }
  
  .title {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .labels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }
  
  .label {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    background: var(--color-border);
    border-radius: 3px;
    color: var(--color-text-secondary, #666);
  }
  
  .comments {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    margin-top: 0.5rem;
  }
</style>
