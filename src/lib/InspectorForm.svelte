<script>
  export let record = {
    src: '',
    label: '',
    entryPoint: '',
    forbiddenTokens: '',
    analyzer: {
      levels: 0,
      visitSimpleFunctions: false,
      visitConstructors: false,
    },
    alwaysDirty: false,
  };
  export let hideSrc = false;

  // Helper to parse forbiddenTokens string into an array
  function parseForbiddenTokens(tokensString) {
    return tokensString ? tokensString.split('|').map(s => s.trim()) : [];
  }

  // Helper to join forbiddenTokens array into a string
  function joinForbiddenTokens(tokensArray) {
    return tokensArray ? tokensArray.join(' | ') : '';
  }

  // Reactive statement to update record.forbiddenTokens when the input changes
  let forbiddenTokensInput = joinForbiddenTokens(record.forbiddenTokens);
  $: record.forbiddenTokens = parseForbiddenTokens(forbiddenTokensInput);

</script>

<div class="inspector-form">
  <section class="options">
    {#if !hideSrc}
      <div class="form-group">
        <label for="src">Library remote source</label>
        <input id="src" type="text" bind:value={record.src} />
      </div>

      <div class="form-group">
        <label for="label">Name displayed</label>
        <input id="label" type="text" bind:value={record.label} />
      </div>
    {/if}

    <div class="form-group">
      <label for="entryPoint">Enter the entry point to this library (might be nested with .)</label>
      <input id="entryPoint" type="text" bind:value={record.entryPoint} />
    </div>

    <div class="form-group">
      <label for="forbiddenTokens">Forbidden tokens:</label>
      <input id="forbiddenTokens" type="text" bind:value={forbiddenTokensInput} />
      <div class="small">
        Pipe (|) separated list of commands that indicate objects that will be ignored
        during the analysis...
      </div>
    </div>

    <div class="form-group">
      <div class="bold">Levels: {record.analyzer.levels}</div>
      <p class="small">
        Defines the maximum depth when running the dfs algorithm starting from the <i>entryPoint</i> object <br />
        WARNING: The higher the value the longer the time needed for the browser to render the nodes
      </p>
      <input type="range" min="0" max="30" bind:value={record.analyzer.levels} />
    </div>

    <div class="form-group checkbox-group">
      <input type="checkbox" id="alwaysDirty" bind:checked={record.alwaysDirty} />
      <label for="alwaysDirty">
        <div class="bold">Analyzer is always dirty</div>
        <p class="small">
          If enabled the analyzer will always perform a clean analysis of the library...
        </p>
      </label>
    </div>

    <div class="form-group checkbox-group">
      <input type="checkbox" id="visitSimpleFunctions" bind:checked={record.analyzer.visitSimpleFunctions} />
      <label for="visitSimpleFunctions">
        <div class="bold">Visit simple functions</div>
        <p class="small">The object analyzer doesn't visit functions that only have the basic properties...
        </p>
      </label>
    </div>

    <div class="form-group checkbox-group">
      <input type="checkbox" id="visitConstructors" bind:checked={record.analyzer.visitConstructors} />
      <label for="visitConstructors">
        <div class="bold">Visit constructors</div>
        <p class="small">
          If <i>visit simple function</i> is enabled it might avoid visiting...
        </p>
      </label>
    </div>
  </section>
</div>

<style>
  .inspector-form {
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

  .form-group input[type="text"],
  .form-group input[type="range"] {
    width: 100%;
    padding: 0.5em;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .checkbox-group {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1em;
  }

  .checkbox-group input[type="checkbox"] {
    margin-right: 0.5em;
    margin-top: 0.2em; /* Align with text */
  }

  .checkbox-group label {
    font-weight: normal;
    margin-bottom: 0;
  }

  .small {
    font-size: 0.8em;
    color: #666;
  }

  .bold {
    font-weight: bold;
  }
</style>
