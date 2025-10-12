<script>
  import LibraryMenu from './LibraryMenu.svelte';
  import { schemas } from './schemas.js';

  const sections = [
    {
      label: 'BuiltIn Objects',
      libraries: schemas.builtInObjects,
    },
    {
      label: 'Notable Libraries',
      libraries: schemas.notableLibraries,
    },
    {
      label: 'My libraries',
      libraries: schemas.myLibraries,
    },
    {
      label: 'Huge Hierarchies',
      libraries: schemas.hugeHierarchies,
    },
  ];
</script>

<div class="sidebar">
  <LibraryMenu {sections} />
</div>
