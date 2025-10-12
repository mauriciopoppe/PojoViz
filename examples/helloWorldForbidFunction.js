// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas')

// hello world object created on the window object
window.hello = {
  world: 'pojoviz',
  aFunction: function () {}
}

pojoviz.run({
  entryPoint: 'hello',
  forbiddenTokens: 'global:Function|global:Function.prototype'
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector)
  })
  .done()
