import _ from 'lodash';
import knownHierarchies from './knownHierarchies';
import notableLibraries from './notableLibraries';
import myLibraries from './myLibraries';
import hugeHierarchies from './hugeHierarchies';
import nodeGlobals from './nodeGlobals';

const proto = {
  find: function (entry) {
    function predicate(v) {
      return v.displayName === entry || v.entryPoint === entry;
    }
    let result;
    _.forOwn(this, function (schema) {
      result = result || _.find(schema, predicate);
    });
    return result;
  }
};

const schemas = Object.create(proto);

_.merge(schemas, {
  knownHierarchies: knownHierarchies,
  notableLibraries: notableLibraries,
  myLibraries: myLibraries,
  hugeHierarchies: hugeHierarchies,
  nodeGlobals: nodeGlobals,
  downloaded: []
});

export default schemas;