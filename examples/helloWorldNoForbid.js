// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas')

// hello world object created on the window object
window.hello = {
  world: 'pojoviz',
  aFunction: function () {}
}

pojoviz.run({
  entryPoint: 'hello',
  // don't forbid any object
  // the default value is 'pojoviz:builtIn|pojoviz:global|global:document'
  forbiddenTokens: ''
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector)
  })
  .done()
