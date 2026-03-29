<script lang="ts">
  import type { GitHubIssue, GitHubComment } from '../../services/github';
  import { onMount } from 'svelte';
  
  export let issue: GitHubIssue;
  export let comments: GitHubComment[] = [];
  export let onBack: () => void = () => {};
  export let onAgentOutput: string = '';
  
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
  
  function formatBody(body: string | null): string {
    if (!body) return 'No description';
    return body;
  }
</script>

<div class="issue-panel">
  <div class="header">
    <button class="back-btn" on:click={onBack}>←</button>
    <span class="number">#{issue.number}</span>
  </div>
  
  <div class="content">
    <h2 class="title">{issue.title}</h2>
    
    <div class="labels">
      {#each issue.labels as label}
        <span class="label">{label}</span>
      {/each}
    </div>
    
    <div class="description">
      <h3>Description</h3>
      <p>{formatBody(issue.body)}</p>
    </div>
    
    <div class="comments">
      <h3>Comments ({comments.length})</h3>
      {#each comments as comment}
        <div class="comment">
          <div class="comment-header">
            <span class="user">{comment.user.login}</span>
            <span class="date">{formatDate(comment.created_at)}</span>
          </div>
          <p class="comment-body">{comment.body}</p>
        </div>
      {/each}
      {#if comments.length === 0}
        <p class="no-comments">No comments yet</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .issue-panel {
    width: 25%;
    min-width: 280px;
    max-width: 400px;
    height: 100%;
    background: var(--color-bg);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  
  .back-btn {
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .back-btn:hover {
    background: var(--color-border);
  }
  
  .number {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
    font-weight: 500;
  }
  
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  
  .title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
  }
  
  .labels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }
  
  .label {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
    background: var(--color-border);
    border-radius: 3px;
    color: var(--color-text-secondary, #666);
  }
  
  .description {
    margin-bottom: 1.5rem;
  }
  
  .description h3,
  .comments h3 {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-secondary, #666);
    margin-bottom: 0.5rem;
  }
  
  .description p {
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre-wrap;
    margin: 0;
  }
  
  .comments {
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }
  
  .comment {
    background: var(--color-bg-secondary, #f5f5f5);
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  
  .comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.375rem;
  }
  
  .user {
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .date {
    font-size: 0.7rem;
    color: var(--color-text-secondary, #999);
  }
  
  .comment-body {
    font-size: 0.8rem;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
  }
  
  .no-comments {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #999);
    text-align: center;
    padding: 1rem;
  }
</style>
