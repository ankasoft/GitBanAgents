<script lang="ts">
  import type { Project } from '../../stores/settings';
  
  export let projects: Project[] = [];
  export let selectedId: string | null = null;
  export let onSelect: (id: string) => void = () => {};
  export let onAdd: () => void = () => {};
  export let onDelete: (id: string) => void = () => {};
</script>

<div class="project-column">
  <div class="header">
    <span class="title">Projects</span>
    <button class="add-btn" on:click={onAdd} title="Add local folder">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <line x1="9" y1="14" x2="15" y2="14"/>
      </svg>
    </button>
  </div>
  <div class="list">
    {#each projects as project (project.id)}
      <div
        class="project-item"
        class:selected={project.id === selectedId}
        role="button"
        tabindex="0"
        on:click={() => onSelect(project.id)}
        on:keydown={(e) => e.key === 'Enter' && onSelect(project.id)}
      >
        <span class="name">{project.name}</span>
        <span class="meta" title={project.path}>
          {project.path}
        </span>
        <button
          class="delete-btn"
          on:click|stopPropagation={() => {
            if (confirm(`Delete project "${project.name}"?`)) {
              onDelete(project.id);
            }
          }}
          title="Delete project"
        >×</button>
      </div>
    {/each}
    {#if projects.length === 0}
      <div class="empty">Click folder icon to add</div>
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
  
  .project-item {
    position: relative;
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
  
  .project-item.selected .delete-btn {
    color: rgba(255,255,255,0.8);
  }
  
  .project-item:hover .delete-btn {
    opacity: 1;
  }
  
  .name {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.125rem;
    padding-right: 20px;
  }
  
  .meta {
    display: block;
    font-size: 0.7rem;
    color: var(--color-text-secondary, #999);
    padding-right: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .delete-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 18px;
    height: 18px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-text-secondary, #999);
    opacity: 0;
    transition: opacity 0.2s, background 0.2s;
  }
  
  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  
  .empty {
    padding: 1rem;
    text-align: center;
    color: var(--color-text-secondary, #999);
    font-size: 0.875rem;
  }
</style>
