// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas')

// a constructor which starts with lowercase wtf
function Mauricio () {

}

Mauricio.prototype = {
  constructor: Mauricio,
  writeCode: function () {},
  readCode: function () {}
}

// save the constructor and an object in the `simple` object
window.simple = {
  aFunction: function () {},
  aConstructor: Mauricio
}

pojoviz.run({
  entryPoint: 'simple'
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector)
  })
  .done()
