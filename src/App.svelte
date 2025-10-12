<script>
  import { onMount } from 'svelte';
  import Toolbar from './lib/Toolbar.svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import Canvas from './lib/Canvas.svelte';
  import Settings from './lib/Settings.svelte';
  import About from './lib/About.svelte';
  import Search from './lib/Search.svelte';
  import Readme from './lib/Readme.svelte';
  import Playground from './lib/Playground.svelte';
  import Notification from './lib/Notification.svelte';
  import ProgressBar from './lib/ProgressBar.svelte';
  import Dialog from './lib/Dialog.svelte';
  import InspectorForm from './lib/InspectorForm.svelte';

  const apiUrl = import.meta.env.BASE_URL
  let page = location.pathname.substring(1);
  let notificationText = '';
  let showNotification = false;
  let showConfigurationDialog = false;
  let currentInspectorRecord = {};
  let showProgressBar = false;

  let canvasElement;

  // Override original pushState so that it fires a custom event.
  (function (history) {
    const originalPushState = history.pushState;
    // Override the native pushState method
    history.pushState = function () {
      // Call the original pushState with the correct context and arguments
      const result = originalPushState.apply(this, arguments);
      // After the history entry is pushed, dispatch a custom event
      const pushStateEvent = new CustomEvent('pushstate', {
        detail: {
          state: arguments[0], // The state object passed to pushState
        },
      });
      window.dispatchEvent(pushStateEvent);

      return result;
    };
  })(window.history);


  function onPageChange(event) {
    history.pushState({
      command: event.detail
    }, "", `${apiUrl}/` +event.detail)
  }

  function getLibraryFromCommand(command) {
    const tokens = command.split('/');
    tokens.shift();
    return tokens.join('/');
  }

  function runLibrary(entry) {
    if (!window.pojoviz || !window.pojoviz.schemas || !window.pojoviz.run || !window.pojoviz.draw) {
      console.error('pojoviz library not fully loaded.');
      return;
    }
    console.log(`running pojoviz on ${entry}`)
    console.log(window.pojoviz.schemas)
    const schema = window.pojoviz.schemas.find(entry);
    if (schema) {
      window.pojoviz
        .run(schema)
        .then(() => {
          window.pojoviz.draw.render();
        })
        .catch((e) => {
          if (window.pojoviz.utils && window.pojoviz.utils.notification) {
            console.error('An error ocurred', e)
            console.error('Stack', e.stack)
            window.pojoviz.utils.notification(e);
          } else {
            console.error('Error running library:', e);
          }
        })
        .finally(() => {
          page = 'app'; // Go back to app page after running library
        });
    } else {
      console.warn('Schema not found for entry:', entry);
    }
  }

  function onRuntimeConfigurationClick() {
    if (window.pojoviz && window.pojoviz.getCurrentInspector) {
      currentInspectorRecord = window.pojoviz.getCurrentInspector();
      showConfigurationDialog = true;
    } else {
      console.warn('pojoviz.getCurrentInspector not available.');
    }
  }

  function onRuntimeConfigurationChange() {
    if (window.pojoviz && window.pojoviz.getCurrentInspector) {
      const inspector = window.pojoviz.getCurrentInspector();
      if (inspector && inspector.setDirty) {
        inspector.setDirty();
        runLibrary(getLibraryFromCommand(location.hash));
      }
    }
    showConfigurationDialog = false;
  }

  onMount(() => {
    function onPageChange(e) {
      const command = e.detail?.state?.command;
      if (command.includes('render/')) {
        runLibrary(getLibraryFromCommand(command));
      } else {
        page = command;
      }
    }
    window.addEventListener('pushstate', onPageChange)
    window.addEventListener('popstate', onPageChange)

    document.addEventListener('my-library-select', (e) => {
      const toRender = e.detail
      history.pushState(
        { command: toRender },
        toRender,
        `/${toRender}`
      );
    });

    document.addEventListener('pojoviz-fetch-start', () => {
      showProgressBar = true;
      console.log('Fetch start');
    });

    document.addEventListener('pojoviz-render-end', () => {
      showProgressBar = false;
      console.log('Render end');
    });

    document.addEventListener('pojoviz-notification', (e) => {
      notificationText = e.detail;
      showNotification = true;
      // Hide notification after 3 seconds
      setTimeout(() => {
        showNotification = false;
      }, 3000);
    });

    onPageChange({
      detail: {
        state: {
          command: page
        }
      }
    })
  });
</script>

<div class="app">
  <header>
    <Toolbar on:page-change={onPageChange} />
  </header>
  <aside>
    <Sidebar />
  </aside>
  <main>
    {#if page === 'readme' || page === ''}
      <Readme url="./README.md" />
    {:else if page === 'development'}
      <Readme url="./DEV_README.md" />
    {:else if page === 'app'}
      <Canvas />
    {:else if page === 'dev'}
      <Playground />
    {:else if page === 'settings'}
      <Settings />
    {:else if page === 'search'}
      <Search />
    {:else if page === 'about'}
      <About />
    {/if}
  </main>
  <Notification text={notificationText} visible={showNotification} />
  <ProgressBar visible={showProgressBar} />

  <Dialog show={showConfigurationDialog} on:close={onRuntimeConfigurationChange} heading="Edit Configuration">
    <InspectorForm bind:record={currentInspectorRecord} />
  </Dialog>
</div>



<style>
  main {
    padding: 1em;
  }
</style>
