<script lang="ts">
  import type { GitHubIssue, GitHubComment } from '../../services/github';
  import IssuePanel from './IssuePanel.svelte';
  import AgentTerminal from './AgentTerminal.svelte';
  
  export let issue: GitHubIssue;
  export let comments: GitHubComment[] = [];
  export let agentOutput: string = '';
  export let agentStatus: 'idle' | 'running' | 'completed' | 'failed' = 'idle';
  export let onBack: () => void = () => {};
  export let onStop: () => void = () => {};
  export let onMoveToReview: () => void = () => {};
</script>

<div class="split-view">
  <IssuePanel
    {issue}
    {comments}
    {onBack}
    {agentOutput}
  />
  <AgentTerminal
    output={agentOutput}
    status={agentStatus}
    {onStop}
    {onMoveToReview}
  />
</div>

<style>
  .split-view {
    display: flex;
    width: 100%;
    height: 100%;
  }
  
  @media (max-width: 768px) {
    .split-view {
      flex-direction: column;
    }
  }
</style>
