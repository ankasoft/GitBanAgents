<script lang="ts">
  import { settings } from '../lib/stores/app';
  
  export let onClose: () => void = () => {};
  
  let localSettings = { ...$settings };
  
  function handleSave() {
    settings.set(localSettings);
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
        <h3>Notifications</h3>
        
        <div class="setting-row">
          <label for="notifications">Enable Notifications</label>
          <input type="checkbox" id="notifications" bind:checked={localSettings.notifications} />
        </div>
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
