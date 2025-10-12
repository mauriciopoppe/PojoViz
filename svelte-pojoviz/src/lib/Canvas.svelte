<script>
  import { onMount } from 'svelte';

  let canvasElement;

  onMount(() => {
    window.pojoviz.draw.getRenderer('d3').setCanvasEl(canvasElement);
    window.pojoviz.draw.getRenderer('three').setCanvasEl(canvasElement);
  });
</script>

<div bind:this={canvasElement} class="canvas-wrapper" style="height: 100%; width: 100%;"></div>

<style>
  .canvas-wrapper {
    /* Add any specific styling for your canvas here */
  }
</style>
