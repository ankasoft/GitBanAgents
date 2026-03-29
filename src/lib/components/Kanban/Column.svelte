<script lang="ts">
  import type { GitHubIssue } from '../../services/github';
  import IssueCard from './IssueCard.svelte';
  
  export let title: string;
  export let color: string;
  export let issues: GitHubIssue[] = [];
  export let onIssueClick: (issue: GitHubIssue) => void = () => {};
  export let onPlay?: (issue: GitHubIssue) => void;
  export let onDrop?: (e: DragEvent) => void;
  
  let isDragOver = false;
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }
  
  function handleDragLeave() {
    isDragOver = false;
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    onDrop?.(e);
  }
</script>

<div
  class="column"
  class:drag-over={isDragOver}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  role="region"
  aria-label="{title} column"
>
  <div class="column-header" style="border-color: {color}">
    <span class="title">{title}</span>
    <span class="count">{issues.length}</span>
  </div>
  <div class="column-content">
    {#each issues as issue (issue.number)}
      <div class="card-wrapper">
        {#if onPlay}
          <button class="play-btn" on:click|stopPropagation={() => onPlay?.(issue)} title="Start agent">
            ▶
          </button>
        {/if}
        <IssueCard {issue} {onIssueClick} />
      </div>
    {/each}
    {#if issues.length === 0}
      <div class="empty">No issues</div>
    {/if}
  </div>
</div>

<style>
  .column {
    flex: 1;
    min-width: 280px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-secondary, #f5f5f5);
    border-radius: 8px;
    overflow: hidden;
    transition: background 0.2s;
  }
  
  .column.drag-over {
    background: rgba(59, 130, 246, 0.1);
    outline: 2px dashed var(--color-primary);
    outline-offset: -2px;
  }
  
  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--color-bg);
    border-bottom: 3px solid;
  }
  
  .title {
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .count {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    background: var(--color-border);
    border-radius: 10px;
    color: var(--color-text-secondary, #666);
  }
  
  .column-content {
    flex: 1;
    padding: 0.75rem;
    overflow-y: auto;
  }
  
  .card-wrapper {
    position: relative;
  }
  
  .play-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 1;
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.7rem;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .card-wrapper:hover .play-btn {
    opacity: 1;
  }
  
  .play-btn:hover {
    transform: scale(1.1);
  }
  
  .empty {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-secondary, #999);
    font-size: 0.875rem;
  }
</style>
