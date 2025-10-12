import utils from "./util/";

import Inspector from "./analyzer/Inspector";
import InspectedInstances from "./InspectedInstances";
import ObjectAnalyzer from "./ObjectAnalyzer";
import schemas from "./hierarchies";

let inspector, oldInspector;
let pojoviz;

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
  run: function (options) {
    const instance = this.getInspectorFromOptions(options);
    instance.modifyInstance(options);
    return instance.init();
  },

  getInspectorFromOptions: function (options) {
    if (!options) {
      throw new Error("Options must be provided");
    }
    const entryPoint = options.displayName || options.entryPoint;
    if (!entryPoint) {
      throw new Error("Entry point must be provided");
    }
    oldInspector = inspector;
    inspector = InspectedInstances[entryPoint];

    if (!inspector) {
      inspector = InspectedInstances.create(options);
    }
    return inspector;
  },

  // expose inner modules
  ObjectAnalyzer: ObjectAnalyzer,
  InspectedInstances: InspectedInstances,
  analyzer: {
    Inspector: Inspector,
  },
  Inspector: Inspector,
  utils: utils,

  // known configurations
  schemas: schemas,
};

// alias
pojoviz.setCurrentInspector = pojoviz.run;

window.pojoviz = pojoviz;

export default pojoviz;
