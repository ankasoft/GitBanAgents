<script lang="ts">
  import type { Project } from '../../lib/api';
  
  export let projects: Project[] = [];
  export let selectedId: string | null = null;
  export let onSelect: (id: string) => void = () => {};
  export let onAdd: () => void = () => {};
</script>

<div class="project-column">
  <div class="header">
    <span class="title">Projects</span>
    <button class="add-btn" on:click={onAdd}>+</button>
  </div>
  <div class="list">
    {#each projects as project (project.id)}
      <button
        class="project-item"
        class:selected={project.id === selectedId}
        on:click={() => onSelect(project.id)}
      >
        <span class="name">{project.name}</span>
        <span class="meta">
          {project.repo}
        </span>
      </button>
    {/each}
    {#if projects.length === 0}
      <div class="empty">No projects added</div>
    {/if}
  </div>
</div>

<style>
  .project-column {
    width: 200px;
    min-width: 200px;
    background: var(--color-bg);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  
  .title {
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .add-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  
  .add-btn:hover {
    opacity: 0.9;
  }
  
  .list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .project-item {
    display: block;
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    margin-bottom: 0.25rem;
    transition: background 0.2s;
  }
  
  .project-item:hover {
    background: var(--color-border);
  }
  
  .project-item.selected {
    background: var(--color-primary);
    color: white;
  }
  
  .project-item.selected .meta {
    color: rgba(255,255,255,0.8);
  }
  
  .name {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.125rem;
  }
  
  .meta {
    display: block;
    font-size: 0.7rem;
    color: var(--color-text-secondary, #999);
  }
  
  .empty {
    padding: 1rem;
    text-align: center;
    color: var(--color-text-secondary, #999);
    font-size: 0.875rem;
  }
</style>
