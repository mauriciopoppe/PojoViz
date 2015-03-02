// d3 renderer setup
pojoviz.draw.getRenderer('d3').setCanvasEl('#canvas');

pojoviz.run({
  label: 'EmberJS',   // ignore this property, it's used for the app
  src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js|//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.1.2/handlebars.js|//cdnjs.cloudflare.com/ajax/libs/ember.js/1.6.1/ember.js',
  entryPoint: 'Ember',
  forbiddenTokens: 'global:$|global:Handlebars|pojoviz:builtIn|global:window|global:document',
  analyzerConfig: {
    levels: 10,
    visitSimpleFunctions: false,
    visitArrays: false
  }
})
  .then(function (inspector) {
    pojoviz.draw.render(inspector);
  })
  .done();