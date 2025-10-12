import utils from "../util/";
import Analyzer from "../ObjectAnalyzer";
import { deepClone, deepMerge, template } from "../util/lodash-replacements";

const searchEngine = "https://duckduckgo.com/?q=";

/**
 * @constructor
 *
 * Instances of the class inspector decide which objects will be
 * analyzed by the internal analyzer it holds, besides doing that
 * this inspector is able to:
 *
 * - do deferred analysis (analysis on demand)
 * - fetch external scripts in series (the analysis is made
 *   when all the scrips have finished loading)
 * - mark itself as an already inspected instance so that
 *   further inspection calls are not made
 * - receive a configuration to forbid complete graphs from
 *   the analysis step
 *
 * Sample usage:
 *
 * Analysis of a simple object:
 *
 *    var x = {};
 *    var inspector = new Inspector();
 *    inspector
 *      .init()
 *      .then(function () {
 *        // x is ready analyzed at this point!
 *        // objects saved in inspector.analyzer = {x}
 *      })
 *
 * As seen in the code there is a default variable which specifies
 * the objects that will be forbidden, the value is a pipe separated
 * list of commands (see @forbiddenTokens) which is making the
 * inspector avoid the builtIn properties, let's avoid that by making
 * forbiddenTokens null:
 *
 *    var x = {};
 *    var inspector = new Inspector({
 *      forbiddenTokens: null
 *    });
 *    inspector
 *      .init()
 *      .then(function () {
 *        // x is ready analyzed at this point!
 *        // objects saved in inspector.analyzer = {x, Object,
 *          Object.prototype, Function, Function.prototype}
 *      })
 *
 * To execute more complex analysis consider overriding:
 *
 * - inspectSelf
 * - getItems
 *
 * See BuiltIn.js for a basic override of the methods above
 *
 * @param {Object} config
 * @param {string} [config.entryPoint]
 * @param {string} [config.src]
 * @param {string} [config.displayName]
 * @param {string} [config.forbiddenTokens=Inspector.DEFAULT_FORBIDDEN_TOKENS]
 */
class Inspector {
  constructor(config) {
    config = deepMerge(deepClone(Inspector.DEFAULT_CONFIG), config);

    /**
     * If provided it'll be used as the starting object from the
     * window object to be analyzed, nested objects can be specified
     * with the dot notation
     * @type {string}
     */
    this.entryPoint = config.entryPoint;

    /**
     * Name to be displayed
     * @type {string}
     */
    this.displayName = config.displayName;

    /**
     * If the inspector needs to fetch external resources use
     * a string separated with the pipe | character, the scripts
     * are loaded in series because one script might need the existence
     * of another before it's fetched
     * @type {string}
     */
    this.src = config.src;

    /**
     * Each token determines which objects will be forbidden
     * when the analyzer is run.
     *
     * Token examples:
     *
     * - pojoviz:{string}
     *   Forbids all the items saved in the {string} instance which
     *   is stored in the InspectedInstances object,
     *   assuming that each is a subclass of `Inspector`
     *
     * e.g.
     *
     *   // forbid all the items found in the builtIn inspector
     *   pojoviz:builtIn
     *
     * - window:{string}
     *   Forbids an object which is in the window object, {string} might
     *   also indicate a nested object using . as a normal property
     *   retrieval
     *
     * e.g.
     *
     *   window:document
     *   window:document.body
     *   window:document.head
     *
     * ForbiddenTokens example:
     *
     *  pojoviz:builtIn|pojoviz:window|window:document
     *
     * @type {string}
     */
    this.forbiddenTokens = [
      config.forbiddenTokens,
      config.additionalForbiddenTokens,
    ]
      .filter(function (token) {
        return !!token;
      })
      .join("|");

    /**
     * This inspector is initially in a dirty state
     * @type {boolean}
     */
    this.dirty = true;

    /**
     * Print debug info
     * @type {boolean}
     */
    this.debug = config.debug;

    /**
     * To avoid reanalyzing the same structure multiple times a small
     * optimization is to mark the inspector as inspected, to avoid
     * this optimization pass alwaysDirty as true in the options
     * @type {boolean}
     */
    this.alwaysDirty = config.alwaysDirty;

    /**
     * An instance of ObjectAnalyzer which will save all
     * the inspected objects
     * @type {ObjectAnalyzer}
     */
    this.analyzer = new Analyzer(config.analyzerConfig);
  }

  set(options) {
    for (const k in options) {
      if (Object.prototype.hasOwnProperty.call(options, k)) {
        if (this.hasOwnProperty(k)) {
          this[k] = options[k];
        }
      }
    }
  }

  /**
   * Init routine, should be called on demand to initialize the
   * analysis process, it orchestrates the following:
   *
   * - fetching of external resources
   * - inspection of elements if the inspector is in a dirty state
   *
   * @returns {Promise}
   */
  async init() {
    this.debug && console.log("%cPojoViz", "font-size: 15px; color: ");
    utils.fireGlobalEvent("pojoviz-fetch-start");
    await this.fetch();
    utils.fireGlobalEvent("pojoviz-fetch-end");
    if (this.alwaysDirty) {
      this.setDirty();
    }
    if (this.dirty) {
      this.debug &&
        console.log(
          "%cInspecting: %s",
          "color: red",
          this.entryPoint || this.displayName,
        );
      this.inspect();
    }
    return this;
  }

  /**
   * @template
   *
   * Performs the analysis of an object given an entryPoint, before
   * performing the analysis it identifies which object need to be
   * forbidden (forbiddenTokens)
   *
   * @chainable
   */
  inspectSelf() {
    const me = this;
    const start = me.findNestedValueInGlobal(me.entryPoint);
    const analyzer = this.analyzer;

    if (!start) {
      console.error(this);
      throw "entry point not found!";
    }
    me.debug && console.log("analyzing window." + me.entryPoint);

    // before inspect hook
    me.beforeInspectSelf();

    // get the objects that need to be forbidden
    const toForbid = me.parseForbiddenTokens();
    me.debug && console.log("forbidding: ", toForbid);
    analyzer.forbid(toForbid, true);

    // perform the analysis
    me.debug && console.log("adding: " + start);
    analyzer.add([start]);

    // after inspect hook
    me.afterInspectSelf();
    return me;
  }

  /**
   * @template
   * before inspect self hook
   */
  beforeInspectSelf() {}

  /**
   * @template
   * after inspect self hook
   */
  afterInspectSelf() {}

  /**
   * Parses the forbiddenTokens string and identifies which
   * objects should be forbidden from the analysis phase
   * @returns {Array}
   */
  parseForbiddenTokens() {
    const me = this;
    const forbidden = this.forbiddenTokens.split("|");
    let toForbid = [];
    me.debug && console.log("about to forbid: ", forbidden);
    forbidden
      .filter(function (v) {
        return !!v;
      })
      .forEach(function (token) {
        let arr = [];
        let tokens;
        if (token.search(/^pojoviz:/) > -1) {
          tokens = token.split(":");

          // if it's a command for the library then make sure it exists
          if (!(tokens[1] in Inspector.instances)) {
            throw new Error(
              `expected ${tokens[1]} to be part of Inspect.instances but it was not found!`,
            );
          }
          arr = Inspector.instances[tokens[1]].getItems();
        } else if (token.search(/^window:/) > -1) {
          tokens = token.split(":");
          arr = [me.findNestedValueInGlobal(tokens[1])];
        }

        toForbid = toForbid.concat(arr);
      });
    return toForbid;
  }

  /**
   * Marks this inspector as dirty
   * @chainable
   */
  setDirty() {
    this.dirty = true;
    this.analyzer.reset();
    return this;
  }

  /**
   * Marks this inspector as not dirty (so that further calls
   * to inspect are not made)
   * @chainable
   */
  unsetDirty() {
    this.dirty = false;
    return this;
  }

  /**
   * @template
   * Should be called after the instance is created to modify it with
   * additional options
   */
  modifyInstance(options) {}

  /**
   * @private
   * Performs the inspection on self
   * @chainable
   */
  inspect() {
    return this.unsetDirty().inspectSelf();
  }

  /**
   * @template
   * Prerender hook
   */
  preRender() {}

  /**
   * @template
   * Postrender hook
   */
  postRender() {}

  /**
   * @templates
   * Returns the predefined items that this inspector is in charge of
   * it's useful to determine which objects need to be discarded in
   * #inspectSelf
   */
  getItems() {
    return [];
  }

  /**
   * Given a string which have tokens separated by the . symbol
   * this methods checks if it's a valid value under the window object
   *
   * e.g.
   *        'document.body'
   *        returns window.document.body since it's a valid object
   *        under the window object
   *
   * @param nestedConfiguration
   * @returns {*}
   */
  findNestedValueInGlobal(nestedConfiguration) {
    if (!nestedConfiguration) {
      return null;
    }
    const tokens = nestedConfiguration.split(".");
    let start = window;
    while (tokens.length) {
      const token = tokens.shift();
      if (!start.hasOwnProperty(token)) {
        return null;
      }
      start = start[token];
    }
    return start;
  }

  /**
   * Fetches all the resources required to perform the inspection,
   * (which are saved in `this.src`), returns a promise which is
   * resolved when all the scrips have finished loading
   * @returns {Promise}
   */
  async fetch() {
    if (!this.src) {
      return;
    }

    if (this.findNestedValueInGlobal(this.entryPoint)) {
      console.log("resource already fetched: " + this.entryPoint);
      return;
    }

    const srcs = this.src.split("|");

    const loadScript = (v) => {
      return new Promise((resolve) => {
        utils.notification("fetching script " + v, true);
        const script = document.createElement("script");
        script.src = v;
        script.onload = () => {
          utils.notification("completed fetching script " + v, true);
          resolve(this.findNestedValueInGlobal(this.entryPoint));
        };
        document.head.appendChild(script);
      });
    };

    for (const src of srcs) {
      await loadScript(src);
    }
  }

  /**
   * Toggles the visibility of the builtIn objects
   * @param visible
   */
  setBuiltInVisibility(visible) {
    const me = this;
    const token = "pojoviz:builtIn";
    const arr = me.forbiddenTokens;
    if (visible) {
      arr.push(token);
    } else {
      arr.splice(arr.indexOf(token), 1);
    }
  }

  showSearch(nodeName, nodeProperty) {
    const me = this;
    const tpl = template(
      "${searchEngine}${lucky}${libraryName} ${nodeName} ${nodeProperty}",
    );
    const compiled = tpl({
      searchEngine: searchEngine,
      lucky: Inspector.lucky ? "!ducky" : "",
      libraryName: me.entryPoint,
      nodeName: nodeName,
      nodeProperty: nodeProperty,
    });
    window.open(compiled);
  }
}

/**
 * An object which holds all the inspector instances created
 * (filled in the file InspectedInstances)
 * @type {Object}
 */
Inspector.instances = null;

/**
 * Default forbidden commands (in node window is the window object)
 * @type {string[]}
 */
Inspector.DEFAULT_FORBIDDEN_TOKENS_ARRAY = [
  "pojoviz:builtIn",
  "window:document",
];

/**
 * Forbidden tokens which are set by default on any Inspector instance
 * @type {string}
 */
Inspector.DEFAULT_FORBIDDEN_TOKENS =
  Inspector.DEFAULT_FORBIDDEN_TOKENS_ARRAY.join("|");

/**
 * Default config used whenever an instance of Inspector is created
 * @type {Object}
 */
Inspector.DEFAULT_CONFIG = {
  src: null,
  entryPoint: "",
  displayName: "",
  alwaysDirty: false,
  debug: !!window.window,
  forbiddenTokens: Inspector.DEFAULT_FORBIDDEN_TOKENS,
  additionalForbiddenTokens: null,
  analyzerConfig: {},
};

/**
 * Update the builtIn visibility of all the new instances to be created
 * @param visible
 */
Inspector.setBuiltInVisibility = function (visible) {
  const me = this;
  const token = "pojoviz:builtIn";
  const arr = me.DEFAULT_FORBIDDEN_TOKENS_ARRAY;
  if (visible) {
    arr.push(token);
  } else {
    arr.splice(arr.indexOf(token), 1);
  }
  me.DEFAULT_CONFIG.forbiddenTokens = arr.join("|");
};

export default Inspector;
