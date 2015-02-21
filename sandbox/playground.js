/**
 * Created by mauricio on 2/15/15.
 */
var p = require('pojoviz');

function withInspector(inspector) {
  inspector.analyzer.stringify();
}

// new
p.setCurrentInspector({
  entryPoint: 'global',
  forbiddenTokens: ''
})
  .then(withInspector)
  .done();

// existing
p.setCurrentInspector({
  entryPoint: 'object'
})
  .then(withInspector)
  .done();