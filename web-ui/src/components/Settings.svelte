<script lang="ts">
  import { settings, githubToken, type Settings } from '../stores/settings';
  
  export let onClose: () => void = () => {};
  
  let localSettings: Settings = { ...$settings };
  
  function handleSave() {
    settings.set(localSettings);
    onClose();
  }
  
  function handleLogout() {
    githubToken.set(null);
    localStorage.removeItem('gitban_settings');
    localStorage.removeItem('gitban_projects');
    onClose();
  }
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <div class="header">
      <h2>Settings</h2>
      <button class="close-btn" on:click={onClose}>×</button>
    </div>
    
    <div class="content">
      <section>
        <h3>Appearance</h3>
        
        <div class="setting-row">
          <label for="theme">Theme</label>
          <select id="theme" bind:value={localSettings.theme}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        
        <div class="setting-row">
          <label for="language">Language</label>
          <select id="language" bind:value={localSettings.language}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>
      
      <section>
        <h3>GitHub</h3>
        <p class="info">Connected</p>
      </section>
      
      <section>
        <h3>Agent Defaults</h3>
        
        <div class="setting-row">
          <label for="defaultAgent">Default Agent</label>
          <select id="defaultAgent" bind:value={localSettings.defaultAgent}>
            <option value="claude">Claude Code</option>
            <option value="opencode">Opencode</option>
            <option value="codex">Codex</option>
          </select>
        </div>
        
        <div class="setting-row">
          <label for="pushOnComplete">Auto-push on complete</label>
          <input type="checkbox" id="pushOnComplete" bind:checked={localSettings.pushOnComplete} />
        </div>
        
        <div class="setting-row">
          <label for="notifications">Notifications</label>
          <input type="checkbox" id="notifications" bind:checked={localSettings.notifications} />
        </div>
        
        <div class="setting-row">
          <label for="branchProtection">Branch Protection</label>
          <input type="checkbox" id="branchProtection" bind:checked={localSettings.branchProtection} />
        </div>
      </section>
      
      <section>
        <h3>Account</h3>
        <button class="danger-btn" on:click={handleLogout}>Logout</button>
      </section>
    </div>
    
    <div class="footer">
      <button class="cancel-btn" on:click={onClose}>Cancel</button>
      <button class="save-btn" on:click={handleSave}>Save</button>
    </div>
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
    max-height: 60vh;
    overflow-y: auto;
  }
  
  section {
    margin-bottom: 1.5rem;
  }
  
  section:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--color-text-secondary, #666);
    margin-bottom: 0.75rem;
  }
  
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
  }
  
  .setting-row label {
    font-size: 0.875rem;
  }
  
  .setting-row select {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
  }
  
  .setting-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
  
  .info {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
  }
  
  .danger-btn {
    padding: 0.5rem 1rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .danger-btn:hover {
    opacity: 0.9;
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
  
  .save-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: white;
  }
</style>
