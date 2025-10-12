<script>
  import { createEventDispatcher } from 'svelte';

  let {text = '', visible = false} = $props()

  const dispatch = createEventDispatcher();

  function hide() {
    visible = false;
    dispatch('hide');
  }
</script>

{#if visible}
  <div class="notification" on:click={hide}>
    {text}
  </div>
{/if}

<style>
  .notification {
    position: fixed;
    bottom: 1em;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 0.8em 1.5em;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
    opacity: 0.9;
  }
</style>
