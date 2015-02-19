/**
 * Created by mauricio on 2/15/15.
 */
var p = require('pojoviz');

global.x = {};

p.setCurrentInspector({
  entryPoint: 'global',
  forbiddenTokens: ''
})
  .then(function () {
    console.log(p.getCurrentInspector());
    console.log(p.getCurrentInspector().analyzer);
  })
  .done();