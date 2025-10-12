import _ from 'lodash';
import Inspector from './analyzer/Inspector';
import RemoteInspector from './analyzer/Remote';
import PObject from './analyzer/Object';
import BuiltIn from './analyzer/BuiltIn';
import Global from './analyzer/Global';
import Angular from './analyzer/Angular';

let libraries;

const proto = {
  /**
   * Creates a new Inspector with `config` as its configuration
   * saved in `this` as `entryPoint`
   * @param {Object} options
   * @chainable
   */
  create: function (options) {
    const displayName = options.displayName || options.entryPoint;
    const Constructor = options.remote ? RemoteInspector : Inspector;
    console.log('creating a generic container for: ' + displayName, options);
    return (libraries[displayName] = new Constructor(options));
  },
  /**
   * Execute `fn` with all the properties saved in `this`
   * @param fn
   * @chainable
   */
  all: function (fn) {
    _.forOwn(libraries, fn);
    return this;
  },
  /**
   * Marks all the properties saved in `this` as dirty
   * @chainable
   */
  setDirty: function () {
    this.all(function (v) {
      v.setDirty();
    });
    return this;
  }
};

libraries = Object.create(proto);
//console.log(libraries);
_.merge(libraries, {
  object: new PObject({
    displayName: 'Object'
  }),
  builtIn: new BuiltIn({
    displayName: 'Built In'
  }),
  global: new Global(),
  //popular
  angular: new Angular()
  //huge
  //three: new Inspector({
  //  entryPoint: 'THREE',
  //  alwaysDirty: true
  //})
});

Inspector.instances = libraries;

export default libraries;

