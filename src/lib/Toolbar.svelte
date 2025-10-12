<script>
  import { createEventDispatcher } from 'svelte';
  import About from './About.svelte';
  import Search from './Search.svelte';

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
  <a href="{apiUrl}">
    <h1>PojoViz</h1>
  </a>
  <div class="spacer"></div>
  <a target="_blank" href="https://github.com/mauriciopoppe/PojoViz">
    <img style="padding-right: 5px" alt="Stars" src="https://img.shields.io/github/stars/mauriciopoppe/PojoViz?style=flat-square&labelColor=343b41"/>
  </a>
  <!-- <button on:click={() => onPageClick('settings')}>Settings</button> -->
  <!-- <Search /> -->
  <About />
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    padding: 1em;
    border-bottom: 1px solid #ccc;
  }

  h1 {
    margin: 0;
  }

  .spacer {
    flex-grow: 1;
  }
</style>
