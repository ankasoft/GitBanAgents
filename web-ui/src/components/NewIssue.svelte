<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let onClose: () => void = () => {};
  
  let title = '';
  let body = '';
  let label = 'backlog';
  
  const LABELS = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'doing', label: 'Doing' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' }
  ];
  
  function handleSubmit() {
    if (!title.trim()) return;
    
    dispatch('create', {
      title: title.trim(),
      body: body.trim(),
      labels: [label]
    });
    
    onClose();
  }
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <div class="header">
      <h2>New Issue</h2>
      <button class="close-btn" on:click={onClose}>×</button>
    </div>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="content">
        <div class="field">
          <label for="title">Title</label>
          <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="Issue title"
            required
          />
        </div>
        
        <div class="field">
          <label for="body">Description</label>
          <textarea
            id="body"
            bind:value={body}
            placeholder="Describe the issue..."
            rows="6"
          ></textarea>
        </div>
        
        <div class="field">
          <label for="label">Initial Status</label>
          <select id="label" bind:value={label}>
            {#each LABELS as l}
              <option value={l.value}>{l.label}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="footer">
        <button type="button" class="cancel-btn" on:click={onClose}>Cancel</button>
        <button type="submit" class="create-btn" disabled={!title.trim()}>Create</button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .modal {
    width: 90%;
    max-width: 500px;
    background: var(--color-bg);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    overflow: hidden;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  
  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text);
    border-radius: 4px;
  }
  
  .close-btn:hover {
    background: var(--color-border);
  }
  
  .content {
    padding: 1rem;
  }
  
  .field {
    margin-bottom: 1rem;
  }
  
  .field:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.375rem;
  }
  
  input[type="text"],
  textarea,
  select {
    width: 100%;
    padding: 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
  }
  
  input[type="text"]:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid var(--color-border);
  }
  
  .cancel-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .create-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: white;
  }
  
  .create-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
