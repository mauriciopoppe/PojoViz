<script>
  import { createEventDispatcher } from 'svelte';

  export let sections = [];

  const dispatch = createEventDispatcher();

  function selectLibrary(libraryId) {
    const event = new CustomEvent('my-library-select', {
      detail: `${libraryId}`,
    });
    document.dispatchEvent(event);
  }
</script>

<div class="library-menu">
  <div class="section">
    <ul>
      <li>
        <a href="/" on:click|preventDefault={() => {
          history.pushState(
            { command: "" },
            "",
            "/"
          )
        }}> README </a>
      </li>
      <li>
        <a href="/development" on:click|preventDefault={() => {
          history.pushState(
            { command: "development" },
            "",
            "/development"
          )
        }}> Development </a>
      </li>
    </ul>
  </div>
  <div class="section">
  </div>
  {#each sections as section}
    <div class="section">
      <h2>{section.label}</h2>
      <ul>
        {#each section.libraries as library}
          <li>
            <a href="{library.entrypoint}" on:click|preventDefault={() => selectLibrary(`render/${library.entrypoint}`)}>
              {library.label}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .library-menu {
    padding: 1em;
  }

  .section h2 {
    font-size: 1.2em;
    margin-bottom: 0.5em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li a {
    display: block;
    padding: 0.5em;
    text-decoration: none;
    color: #333;
  }

  li a:hover {
    background-color: #eee;
  }
</style>
