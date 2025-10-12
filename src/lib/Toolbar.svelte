<script>
  import { createEventDispatcher } from 'svelte';
  import Search from './Search.svelte';
  import Dialog from './Dialog.svelte';

  let showAboutDialog = false;

  const apiUrl = import.meta.env.BASE_URL
  const dispatch = createEventDispatcher();

  function onPlaygroundClick() {
    dispatch('page-change', 'dev');
  }

  function onPageClick(page) {
    dispatch('page-change', page);
  }
</script>

<div class="toolbar">
  <a class="tw:flex tw:items-center tw:gap-1" href="{apiUrl}">
    <h1 class="tw:text-3xl">PojoViz</h1>
    <span class="tw:text-sm tw:mt-2 tw:ml-2"> Visualize JS objects hierarchies. </span>
  </a>
  <div class="spacer"></div>
  <div class="tw:flex tw:gap-3">
    <a target="_blank" href="https://github.com/mauriciopoppe/PojoViz">
      <button class="tw:border tw:rounded-sm tw:text-sm tw:py-1 tw:px-2 tw:hover:cursor-pointer tw:flex tw:items-center tw:gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
        </svg>
        mauriciopoppe/PojoViz
      </button>
    </a>
    <button class="tw:border tw:rounded-sm tw:text-sm tw:py-1 tw:px-2 tw:hover:cursor-pointer" on:click={() => showAboutDialog = true}>About</button>
  </div>

  <Dialog show={showAboutDialog} on:close={() => showAboutDialog = false} title="About">
    <p>
      <a target="_blank" class="tw:underline tw:decoration-solid" href="https://mauriciopoppe.com/links">Made by Mauricio Poppe</a>, thank you for checking this
      tool!
    </p>

    <p>
      <a target="_blank" href="https://github.com/mauriciopoppe/PojoViz">
        Here's the source code
      </a>
    </p>

    <p>
      Powered by:
    </p>

    <div class="powered-by">
      <a href="https://d3js.org" target="_blank">
        d3
      </a>
      <a href="https://github.com/cpettitt/dagre" target="_blank">
        Dagre
      </a>
      <a href="https://duckduckgo.com" target="_blank">
        <img src="https://duckduckgo.com/assets/icons/meta/DDG-icon_64x64.png" alt="DuckDuckGo">
      </a>
    </div>
  </Dialog>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    padding: 1em;
    border-bottom: 1px solid #ccc;
  }

  .spacer {
    flex-grow: 1;
  }

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
