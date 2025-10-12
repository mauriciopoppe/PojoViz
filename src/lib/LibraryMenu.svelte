<script>
  import { createEventDispatcher } from 'svelte';

  const apiUrl = import.meta.env.BASE_URL
  let { sections } = $props()
  const pushHref = (e) => {
    history.pushState(
      { command: e.target.href },
      "",
      e.target.href
    )
  }
</script>

<div class="tw:p-3">
  <div>
    <h2 class="tw:text-xl tw:mt-2 tw:font-sans">What's PojoViz?</h2>
    <ul>
      <li>
        <a class="tw:block tw:px-2 tw:py-1 tw:font-serif tw:hover:bg-gray-100" href="{apiUrl}" on:click|preventDefault={pushHref}> README </a>
      </li>
      <li>
        <a class="tw:block tw:px-2 tw:py-1 tw:font-serif tw:hover:bg-gray-100" href="{apiUrl}#development" on:click|preventDefault={pushHref}> Development </a>
      </li>
    </ul>
  </div>
  {#each sections as section}
    <div class="section">
      <h2 class="tw:text-xl tw:mt-2 tw:font-sans">{section.label}</h2>
      <ul>
        {#each section.libraries as library}
          <li>
            <a class="tw:block tw:px-2 tw:py-1 tw:font-serif tw:hover:bg-gray-100" href="{apiUrl + '#render/' + library.entryPoint}" on:click|preventDefault={pushHref}>
              {library.label || library.entryPoint}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
</style>
