<script>
  import { createEventDispatcher } from 'svelte';
  import TwitterButton from './TwitterButton.svelte';
  import About from './About.svelte';
  import Search from './Search.svelte';

  const dispatch = createEventDispatcher();

  function onPlaygroundClick() {
    dispatch('page-change', 'dev');
  }

  function onPageClick(page) {
    dispatch('page-change', page);
  }
</script>

<div class="toolbar">
  <div class="spacer"></div>
  <img style="padding-right: 5px" alt="Stars" src="https://img.shields.io/github/stars/mauriciopoppe/PojoViz?style=flat-square&labelColor=343b41"/>
  <!-- <button on:click={() => onPageClick('settings')}>Settings</button> -->
  <!-- <Search /> -->
  <About />
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    padding: 0.5em;
    border-bottom: 1px solid #ccc;
  }

  .spacer {
    flex-grow: 1;
  }
</style>
