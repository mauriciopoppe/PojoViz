// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas');

pojoviz.run({
  entryPoint: 'pojoviz'
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector);
  })
  .done();