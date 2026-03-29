<script lang="ts">
  export let output: string = '';
  export let status: 'idle' | 'running' | 'completed' | 'failed' = 'idle';
  export let onStop: () => void = () => {};
  export let onMoveToReview: () => void = () => {};
  
  function getStatusColor(s: typeof status) {
    switch (s) {
      case 'running': return '#f59e0b';
      case 'completed': return '#22c55e';
      case 'failed': return '#dc2626';
      default: return '#64748b';
    }
  }
  
  function getStatusText(s: typeof status) {
    switch (s) {
      case 'running': return 'Running...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Idle';
    }
  }
</script>

<div class="agent-terminal">
  <div class="header">
    <div class="status">
      <span class="indicator" style="background: {getStatusColor(status)}"></span>
      <span class="text">{getStatusText(status)}</span>
    </div>
    <div class="actions">
      {#if status === 'running'}
        <button class="stop-btn" on:click={onStop}>Stop</button>
      {/if}
      {#if status === 'completed' || status === 'failed'}
        <button class="review-btn" on:click={onMoveToReview}>Move to Review</button>
      {/if}
    </div>
  </div>
  
  <div class="output">
    {#if output}
      <pre>{output}</pre>
    {:else}
      <div class="placeholder">
        Agent output will appear here...
      </div>
    {/if}
  </div>
</div>

<style>
  .agent-terminal {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: #e5e5e5;
    overflow: hidden;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: #2a2a2a;
    border-bottom: 1px solid #404040;
  }
  
  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .text {
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .stop-btn,
  .review-btn {
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .stop-btn {
    background: #dc2626;
    color: white;
  }
  
  .review-btn {
    background: #22c55e;
    color: white;
  }
  
  .stop-btn:hover {
    opacity: 0.9;
  }
  
  .review-btn:hover {
    opacity: 0.9;
  }
  
  .output {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
  }
  
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .placeholder {
    color: #666;
    text-align: center;
    padding-top: 2rem;
  }
</style>
