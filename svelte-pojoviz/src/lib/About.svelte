<script>
  import Dialog from './Dialog.svelte';

  let showAboutDialog = false;

  function onClick() {
    showAboutDialog = true;
  }

  function onClose() {
    showAboutDialog = false;
  }
</script>

<button on:click={onClick}>About</button>

<Dialog show={showAboutDialog} on:close={onClose} heading="About">
  <p>
    Author <a target="_blank" href="https://twitter.com/iMauricio">@iMauricio</a>, have fun!
  </p>

  <p>
    Powered by:
  </p>

  <div class="powered-by">
    <a href="https://d3js.org" target="_blank">
      <img src="/images/d3.png" alt="D3.js" height="64">
    </a>
    <a href="https://threejs.org" target="_blank">
      <img src="/images/threejs.png" alt="Three.js" height="64">
    </a>
    <a href="https://github.com/cpettitt/dagre" target="_blank">
      <img src="/images/dagre.png" alt="Dagre">
    </a>
    <a href="https://duckduckgo.com" target="_blank">
      <img src="https://duckduckgo.com/assets/icons/meta/DDG-icon_64x64.png" alt="DuckDuckGo">
    </a>
  </div>
</Dialog>

<style>
  .powered-by {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 1em;
  }

  .powered-by img {
    max-height: 64px;
    width: auto;
  }
</style>