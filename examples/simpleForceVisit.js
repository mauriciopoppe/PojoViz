// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas')

// a constructor which starts with lowercase wtf
function mauricio () {

}

mauricio.prototype = {
  constructor: mauricio,
  writeCode: function () {},
  readCode: function () {}
}

// save the constructor and an object in the `simple` object
window.simple = {
  aFunction: function () {},
  aConstructor: mauricio
}

pojoviz.run({
  entryPoint: 'simple',
  analyzerConfig: {
    visitSimpleFunctions: true
  }
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector)
  })
  .done()
