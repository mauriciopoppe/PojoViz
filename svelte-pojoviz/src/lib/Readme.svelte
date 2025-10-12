<script>
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/default.css';

  export let url;
  let readme = '';

  const md = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre><code class="hljs">' +
                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                '</code></pre>';
        } catch (__) {}
      }

      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    }
  });


  $: if (url) {
    fetch(url)
      .then(res => res.text())
      .then(text => {
        readme = md.render(text);
      });
  }
</script>

<div class="readme">
  {@html readme}
</div>

<style>
  .readme {
    padding: 1rem;
  }
  :global(pre[class*="language-"]) {
    font-family: monospace !important;
  }
</style>
