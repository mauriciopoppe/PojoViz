// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas')

// hello world object created on the window object
window.hello = {
  world: 'pojoviz',
  aFunction: function () {}
}

// internally does the following:
// var inspector = new Inspector(config);
// return inspector.init();      // which is a promise
pojoviz.run({
  entryPoint: 'hello'
})
  .then(function (inspector) {
    // the inspector has analyzed all the objects
    // steps done:
    // - stringify the analyzer
    // - create a layout for the nodes
    // - render the nodes
    pojoviz.draw.render(inspector)
  })
  .done()
