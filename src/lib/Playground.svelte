<script>
  import { onMount } from 'svelte';
  import CodeMirrorEditor from './CodeMirrorEditor.svelte';

  let code = '';
  let iframeSrc = '';
  let codeMirrorInstance;

  function runCode() {
    iframeSrc = `data:text/html;charset=utf-8,<body><script>${code}<\/script><\/body>`;
  }

  function handleCodeChange(event) {
    code = event.detail;
  }

  function goBack() {
    // This will be handled by the parent App.svelte component's page-change event
  }

  onMount(() => {
    // This is a placeholder for the original pojoviz.draw.createIFrame
    // In a real scenario, you might want to pass the iframe element to pojoviz
    // or refactor pojoviz to work with Svelte's reactivity.
  });
</script>

<div class="playground-container">
  <div class="controls">
    <h1>Playground</h1>
    <button on:click={goBack}>Go Back</button>
    <button on:click={runCode}>Run code</button>
  </div>
  <div class="editor-and-output">
    <CodeMirrorEditor bind:value={code} on:code-change={handleCodeChange} bind:this={codeMirrorInstance} />
    <iframe src={iframeSrc} class="code-output"></iframe>
  </div>
</div>

<style>
  .playground-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .controls {
    padding: 1em;
    border-bottom: 1px solid #eee;
  }

  .editor-and-output {
    display: flex;
    flex: 1;
  }

  .code-output {
    flex: 1;
    border: 1px solid #ccc;
    margin: 0.5em;
    padding: 0.5em;
  }
</style>
