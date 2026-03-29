<script lang="ts">
  import { initOctokit, getUserRepos, type GitHubRepo } from '../services/github';
  import { githubToken } from '../stores/settings';
  
  let token = '';
  let error = '';
  let loading = false;
  let repos: GitHubRepo[] = [];
  let step: 'token' | 'repo' = 'token';
  
  async function handleTokenSubmit() {
    if (!token.trim()) {
      error = 'Token is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      initOctokit(token.trim());
      repos = await getUserRepos();
      step = 'repo';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to authenticate';
    } finally {
      loading = false;
    }
  }
  
  export function selectRepo(repo: GitHubRepo) {
    console.log('Selected repo:', repo);
  }
</script>

<div class="setup">
  {#if step === 'token'}
    <div class="token-step">
      <h2>GitHub Token</h2>
      <p>Enter your GitHub Personal Access Token to continue.</p>
      <a href="https://github.com/settings/tokens/new?scopes=repo&description=GitBanAgent" target="_blank">
        Create Token
      </a>
      
      <form on:submit|preventDefault={handleTokenSubmit}>
        <input
          type="password"
          bind:value={token}
          placeholder="ghp_xxxxxxxxxxxx"
          disabled={loading}
        />
        {#if error}
          <p class="error">{error}</p>
        {/if}
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Continue'}
        </button>
      </form>
    </div>
  {:else if step === 'repo'}
    <div class="repo-step">
      <h2>Select Repository</h2>
      <div class="repo-list">
        {#each repos as repo}
          <button class="repo-item" on:click={() => selectRepo(repo)}>
            {repo.fullName}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .setup {
    max-width: 500px;
    margin: 4rem auto;
    padding: 2rem;
    background: var(--color-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  h2 {
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--color-text-secondary, #666);
    margin-bottom: 1rem;
  }
  
  a {
    display: inline-block;
    margin-bottom: 1rem;
    color: var(--color-primary);
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  input {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  button {
    padding: 0.75rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error {
    color: #dc2626;
    font-size: 0.875rem;
  }
  
  .repo-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .repo-item {
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .repo-item:hover {
    background: var(--color-border);
  }
</style>
