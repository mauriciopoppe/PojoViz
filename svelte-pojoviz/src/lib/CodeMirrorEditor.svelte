<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as monaco from 'monaco-editor';

  export let value = '';
  export let mode = 'javascript';

  let editor;
  let editorContainer;

  const dispatch = createEventDispatcher();

  onMount(() => {
    editor = monaco.editor.create(editorContainer, {
      value: value,
      language: mode,
      automaticLayout: true,
      theme: 'vs-dark', // You can change the theme here
    });

    editor.onDidChangeModelContent(() => {
      value = editor.getValue();
      dispatch('code-change', value);
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.dispose();
    }
  });

  export function refresh() {
    if (editor) {
      editor.layout();
    }
  }

  // React to changes in the `value` prop from outside
  $: if (editor && value !== editor.getValue()) {
    editor.setValue(value);
  }
</script>

<div bind:this={editorContainer} style="height: 100%; width: 100%;"></div>

<style>
  /* Adjust Monaco Editor styles as needed */
</style>