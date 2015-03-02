// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas');

pojoviz.run({
  entryPoint: 'pojoviz',
  analyzerConfig: {
    visitArrays: false,
    levels: 0
  }
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector);
  })
  .done();