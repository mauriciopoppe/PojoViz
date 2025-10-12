<script>
  let { visible = false } = $props();
</script>

{#if visible}
  <div class="progress-bar">
    <div class="progress-bar-inner"></div>
  </div>
{/if}

<style>
  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: #f3f3f3;
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
  }

  .progress-bar-inner {
    width: 100%;
    height: 100%;
    background-color: #e84e40;
    animation: indeterminate-progress 1s infinite linear;
    transform-origin: 0% 50%;
  }

  @keyframes indeterminate-progress {
    0% {
      transform: translateX(-100%) scaleX(0);
    }
    50% {
      transform: translateX(0%) scaleX(0.5);
    }
    100% {
      transform: translateX(100%) scaleX(0);
    }
  }
</style>
