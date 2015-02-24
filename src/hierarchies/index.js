/**
 * Created by mauricio on 2/17/15.
 */
var _ = require('lodash');

var proto = {
  find: function (entry) {
    function predicate(v) {
      return v.displayName === entry || v.entryPoint === entry;
    }
    var result;
    _.forOwn(this, function (schema) {
      result = result || _.find(schema, predicate);
    });
    return result;
  }
};

var schemas = Object.create(proto);

_.merge(schemas, {
  knownHierarchies: require('./knownHierarchies'),
  notableLibraries: require('./notableLibraries'),
  myLibraries: require('./myLibraries'),
  hugeHierarchies: require('./hugeHierarchies'),
  nodeGlobals: require('./nodeGlobals'),
  downloaded: []
});

module.exports = schemas;