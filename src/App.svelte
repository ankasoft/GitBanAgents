<script lang="ts">
  import { githubToken, settings } from './lib/stores/settings';
  import Setup from './lib/components/Setup.svelte';
  
  let isAuthenticated = false;
  let showSetup = true;
  
  githubToken.subscribe(token => {
    isAuthenticated = !!token;
    showSetup = !isAuthenticated;
  });
  
  function handleTheme() {
    const theme = $settings.theme;
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  }
  
  settings.subscribe(handleTheme);
  handleTheme();
</script>

<main>
  {#if showSetup}
    <Setup />
  {:else}
    <div class="app">
      <header class="topbar">
        <div class="logo">GitBan Agent</div>
        <div class="actions">
          <button class="settings-btn">Settings</button>
        </div>
      </header>
      <div class="content">
        <p>Kanban board will appear here...</p>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    height: 48px;
  }
  
  .logo {
    font-weight: 600;
    font-size: 1rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .settings-btn {
    padding: 0.375rem 0.75rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .settings-btn:hover {
    background: var(--color-border);
  }
  
  .content {
    flex: 1;
    padding: 1rem;
    overflow: auto;
  }
</style>
