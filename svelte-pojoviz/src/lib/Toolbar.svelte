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
  <button on:click={onPlaygroundClick}>Playground</button>
  <div class="spacer"></div>
  <TwitterButton tweetText="pojoviz - visualization of plain old JS objects" via="iMauricio" hashtag="pojoviz,dataviz,d3,threejs" />
  <iframe src="http://ghbtns.com/github-btn.html?user=maurizzzio&amp;repo=PojoViz&amp;type=watch&amp;count=true" allowtransparency="true" frameborder="0" scrolling="no" width="110" height="20"></iframe>
  <Search />
  <About />
  <button on:click={() => onPageClick('settings')}>Settings</button>
  <button on:click={() => onPageClick('readme')}>Readme</button>
  <button on:click={() => onPageClick('development')}>Development</button>
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