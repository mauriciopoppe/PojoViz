var _ = require('lodash');
var Q = require('q');
var utils = require('./util/');
var InspectedInstances = require('./InspectedInstances');
var assert = require('assert');

// enable promise chain debug
Q.longStackSupport = true;

var inspector, oldInspector;
var pojoviz;

// public api
pojoviz = {
  /**
   * Clears the inspector variable
   * @chainable
   */
  unsetInspector: function () {
    oldInspector = inspector;
    inspector = null;
    return this;
  },
  /**
   * Gets the current inspector (set through #setCurrentInspector)
   * @returns {*}
   */
  getCurrentInspector: function () {
    return inspector;
  },
  /**
   * Given an object containing the configuration options of a
   * possible new instance of Inspector, this method checks if there's
   * already an instance with the same displayName/entryPoint to avoid
   * creating more Instances of the same type, calls the hook
   * `modifyInstance` after the inspector is retrieved/created
   *
   * @param {config} options Options passed to an Inspector instance
   * if the entryPoint/displayName wasn't created yet in
   * InspectorInstances
   * @returns {Promise}
   */
  setCurrentInspector: function (options) {
    var entryPoint = options.displayName || options.entryPoint;
    assert(entryPoint);
    oldInspector = inspector;
    inspector = InspectedInstances[entryPoint];

    if (!inspector) {
      inspector = InspectedInstances.create(options);
    //} else {
    //  // required to fetch external resources
    //  inspector.src = options.src;
    }
    inspector.modifyInstance(options);
    return inspector.init();
  },

  // expose inner modules
  ObjectAnalyzer: require('./ObjectAnalyzer'),
  InspectedInstances: require('./InspectedInstances'),
  analyzer: {
    Inspector: require('./analyzer/Inspector')
  },
  Inspector: require('./analyzer/Inspector'),
  utils: require('./util'),

  // known configurations
  schemas: require('./schemas')
};

// custom events
global.document && document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getCurrentInspector()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;