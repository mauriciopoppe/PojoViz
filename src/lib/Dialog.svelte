<script>
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let heading = '';

  const dispatch = createEventDispatcher();

  function closeDialog() {
    show = false;
    dispatch('close');
  }
</script>

{#if show}
  <div class="dialog-backdrop" on:click={closeDialog}></div>
  <div class="dialog-content">
    <div class="dialog-header">
      <h2>{heading}</h2>
      <button on:click={closeDialog}>&times;</button>
    </div>
    <div class="dialog-body">
      <slot></slot>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .dialog-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 1.5em;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    min-width: 300px;
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1em;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 1.5em;
  }

  .dialog-header button {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    padding: 0.2em 0.5em;
  }

  .dialog-body {
    /* Content will be slotted here */
  }
</style>
