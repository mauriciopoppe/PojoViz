<script>
  import LibraryMenu from './LibraryMenu.svelte';
  import { builtInObjects, notableLibraries, myLibraries, hugeLibraries } from '../pojoviz/hierarchies/index.js';

  const sections = [
    {
      label: 'BuiltIn Objects',
      libraries: builtInObjects,
    },
    {
      label: 'Notable Libraries',
      libraries: notableLibraries,
    },
    {
      label: 'My libraries',
      libraries: myLibraries,
    },
    {
      label: 'Huge Hierarchies',
      libraries: hugeLibraries,
    },
  ];
</script>

<div class="sidebar">
  <LibraryMenu {sections} />
</div>
