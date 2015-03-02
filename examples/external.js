// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas');

pojoviz.run({
  src: 'http://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.1.1/katex.min.js',
  entryPoint: 'katex',
  analyzerConfig: {
    visitSimpleFunctions: true
  }
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector);
  })
  .done();