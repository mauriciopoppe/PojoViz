<script>
  import { createEventDispatcher } from 'svelte';
  import Dialog from './Dialog.svelte';
  import InspectorForm from './InspectorForm.svelte';

  let showSearchDialog = false;
  let query = '';
  let searchResults = [];
  let selectedLibrary = null;
  let options = {
    analyzer: {},
  };
  let spinnerActive = false;

  const dispatch = createEventDispatcher();

  let searchTimeout;

  function onIconClick() {
    // Reset options to default when opening the dialog
    options = {
      analyzer: {
        levels: 0,
        visitSimpleFunctions: false,
        visitConstructors: false,
      },
      alwaysDirty: false,
      src: '',
      label: '',
      entryPoint: '',
      forbiddenTokens: '',
    };
    searchResults = [];
    query = '';
    selectedLibrary = null;
    showSearchDialog = true;
  }

  function closeDialog() {
    showSearchDialog = false;
  }

  function handleQueryInput() {
    clearTimeout(searchTimeout);
    if (query.trim()) {
      searchTimeout = setTimeout(() => {
        const urlRegex = /^\s*https?:\/\/.*/i;
        if (urlRegex.test(query)) {
          options.src = query;
          options.label = query;
          selectedLibrary = { name: query, latest: query };
        } else {
          onSearch();
        }
      }, 1000);
    }
  }

  async function onSearch() {
    spinnerActive = true;
    try {
      const response = await fetch(`https://api.cdnjs.com/libraries?search=${query}&fields=assets`);
      const data = await response.json();
      searchResults = data.results;
    } catch (error) {
      console.error('Error fetching search results:', error);
      searchResults = [];
    }
    spinnerActive = false;
  }

  function onRadioSelectChange(event) {
    const selectedValue = event.target.value;
    const selectedName = event.target.dataset.name;

    options.label = selectedName;
    options.src = selectedValue;
    selectedLibrary = { name: selectedName, latest: selectedValue };
  }

  function onAddLibrary() {
    if (options.label && options.entryPoint) {
      // Assuming pojoviz.utils.notification and pojoviz.schemas.downloaded are available globally
      if (window.pojoviz && window.pojoviz.utils && window.pojoviz.schemas) {
        window.pojoviz.utils.notification(
          `added library ${options.label}! Find it under the "Downloaded" accordion`
        );
        // Deep copy to avoid reactivity issues with the form
        const newLibrary = JSON.parse(JSON.stringify(options));
        // The original Polymer component had analyzer and analyzerConfig. We'll keep analyzer for now.
        // newLibrary.analyzerConfig = newLibrary.analyzer;
        // delete newLibrary.analyzer;
        window.pojoviz.schemas.downloaded.push(newLibrary);
      } else {
        console.warn('pojoviz global object not fully available for adding library.');
        // Fallback for demonstration if pojoviz is not fully loaded
        window.pojoviz.schemas.downloaded.push(JSON.parse(JSON.stringify(options)));
      }
      closeDialog();
    } else {
      alert('Please provide Display Name and Entry Point.');
    }
  }
</script>

<button on:click={onIconClick}>Search</button>

<Dialog show={showSearchDialog} on:close={closeDialog} heading="Library Search">
  <div class="search-content">
    <div class="small">Powered by <a href='https://cdnjs.com/' target="_blank">cdn.js</a></div>

    <div class="form-group">
      <label for="query">Add your preferred library</label>
      <input id="query" type="text" bind:value={query} on:input={handleQueryInput} />
    </div>

    {#if spinnerActive}
      <p>Loading...</p>
    {/if}

    <div class="results">
      {#each searchResults as record (record.name)}
        <div class="record">
          <label>
            <input
              type="radio"
              name="librarySelection"
              value={record.latest}
              data-name={record.name}
              on:change={onRadioSelectChange}
              checked={selectedLibrary && selectedLibrary.name === record.name}
            />
            <div class="library-info">
              <div class="library-name">{record.name}</div>
              <div class="library-url">{record.latest}</div>
            </div>
          </label>
        </div>
      {:else}
        {#if query && !spinnerActive}
          <p>No results found.</p>
        {/if}
      {/each}
    </div>

    {#if selectedLibrary}
      <InspectorForm bind:record={options} hideSrc={true} />

      <h3>{options.label || selectedLibrary.name} configuration</h3>
      <div class="small">
        <div>Display Name: <kbd>{options.label || selectedLibrary.name}</kbd></div>
        <div>Source: <kbd>{options.src || selectedLibrary.latest}</kbd></div>
        <div>Levels: <kbd>{options.analyzer.levels}</kbd></div>
        <div>Entry Point: <kbd>{options.entryPoint}</kbd></div>
        <div>Always dirty: <kbd>{options.alwaysDirty}</kbd></div>
        <div>Visit simple functions: <kbd>{options.analyzer.visitSimpleFunctions}</kbd></div>
      </div>
    {/if}

    <div class="docked-bottom">
      <button on:click={onAddLibrary} disabled={!(options.label && options.entryPoint)}>Add Library</button>
      <button on:click={closeDialog}>Close</button>
    </div>
  </div>
</Dialog>

<style>
  .search-content {
    padding: 1em;
  }

  .form-group {
    margin-bottom: 1em;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
  }

  .form-group input[type="text"] {
    width: 100%;
    padding: 0.5em;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .results {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #eee;
    padding: 0.5em;
    margin-bottom: 1em;
  }

  .results .record label {
    display: flex;
    align-items: center;
    padding: 0.5em;
    cursor: pointer;
  }

  .results .record label:hover {
    background-color: #f0f0f0;
  }

  .results .record input[type="radio"] {
    margin-right: 0.5em;
  }

  .library-info {
    flex-grow: 1;
  }

  .library-name {
    font-weight: bold;
  }

  .library-url {
    font-size: 0.8em;
    color: #666;
    word-wrap: break-word;
  }

  .docked-bottom {
    display: flex;
    justify-content: flex-end;
    gap: 1em;
    margin-top: 1em;
  }

  .small {
    font-size: 0.8em;
    color: #666;
  }

  kbd {
    background-color: #eee;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }
</style>
