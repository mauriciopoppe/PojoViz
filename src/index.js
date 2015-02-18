var _ = require('lodash');
var Q = require('q');
var dagre = require('dagre');
var utils = require('./util/');
var InspectedInstances = require('./InspectedInstances');
var assert = require('assert');

// enable promise chain debug
Q.longStackSupport = true;

var inspector, oldInspector;
var renderer, oldRenderer;
var pojoviz;

/**
 * Given an inspector instance it build the graph and also the
 * layout of the nodes belonging to it, the resulting object is
 * an object which is used by a renderer to be drawn
 *
 * @return {Object} return An object with the following info:
 *  {
 *     nodes: [array of objects, each having label,x,y,height,
 *            width,properties,successors,predecessors],
 *     edges: [array of objects, each having to,from,property],
 *     center: an object with the center of the bbox that covers
 *            the layout of the graph
 *     mn: an object with info about the minimum x,y of the bbox
 *            that covers the layout of the graph
 *     mx: an object with info about the maximum x,y of the bbox
 *            that covers the layout of the graph
 *  }
 */
function process(inspector) {
  var g = new dagre.Digraph(),
      node,
      analyzer = inspector.analyzer,
      str = analyzer.stringify(),
      libraryNodes = str.nodes,
      libraryEdges = str.edges;

  // create the graph
  // each element of the graph has
  // - label
  // - width
  // - height
  // - properties
  _.forOwn(libraryNodes, function (properties, k) {
    var label = k.match(/\S*?-(.*)/)[1];
    //console.log(k, label.length);
    node = {
      label: k,
      width: label.length * 10
    };
    // lines + header + padding bottom
    node.height = properties.length * 15 + 50;
    node.properties = properties;
    properties.forEach(function (v) {
      node.width = Math.max(node.width, v.property.length * 10);
    });
    g.addNode(k, node);
  });

  // build the edges from node to node
  _.forOwn(libraryEdges, function (links) {
    links.forEach(function (link) {
      if (g.hasNode(link.from) && g.hasNode(link.to)) {
        g.addEdge(null, link.from, link.to);
      }
    });
  });

  // generate the graph layout
  var layout = dagre.layout()
    .nodeSep(30)
    // .rankSep(70)
    // .rankDir('TB')
    .run(g);

  var nodes = [],
      edges = [],
      center = {x: 0, y: 0},
      mn = {x: Infinity, y: Infinity},
      mx = {x: -Infinity, y: -Infinity},
      total = g.nodes().length;

  // update the node info adding:
  // - x (x-coordinate of the center of the node)
  // - y (y-coordinate of the center of the node)
  // - predecessors (an array with the identifiers of the predecessors of this node)
  // - successors (an array with the identifiers of the successor of this node)
  layout.eachNode(function (k, layoutInfo) {
    var x = layoutInfo.x;
    var y = layoutInfo.y;

    node = g.node(k);
    node.x = x;
    node.y = y;
    node.predecessors = g.predecessors(k);
    node.successors = g.successors(k);
    nodes.push(node);

    // calculate the bbox of the graph to center the graph
    var mnx = x - node.width / 2;
    var mny = y - node.height / 2;
    var mxx = x + node.width / 2;
    var mxy = y + node.height / 2;

    center.x += x;
    center.y += y;
    mn.x = Math.min(mn.x, mnx);
    mn.y = Math.min(mn.y, mny);
    // console.log(x, y, ' dim ', node.width, node.height);
    mx.x = Math.max(mx.x, mxx);
    mx.y = Math.max(mx.y, mxy);
  });

  center.x /= (total || 1);
  center.y /= (total || 1);

  // create the edges from property to node
  _.forOwn(libraryEdges, function (links) {
    links.forEach(function (link) {
      if (g.hasNode(link.from) && g.hasNode(link.to)) {
        edges.push(link);
      }
    });
  });

  return {
    edges: edges,
    nodes: nodes,
    center: center,
    mn: mn,
    mx: mx
  };
}

/**
 * Draws the current inspector in the canvas with the following steps:
 *
 * - clears the canvas
 * - processes the data of the current inspector
 * - renders the data produced by the method above
 * - notifies the user of any action performed
 *
 */
function render() {
  var data;

  if (inspector === oldInspector) {
    return;
  }

  utils.notification('processing ' + inspector.entryPoint);

  // pre render
  oldRenderer && oldRenderer.clean();
  renderer.clean();

  setTimeout(function () {
    inspector.preRender();
    console.log('process & render start: ', new Date());
    // data:
    // - edges (property -> node)
    // - nodes
    // - center
    console.time('process');
    data = process(inspector);
    console.timeEnd('process');

    utils.notification('rendering ' + inspector.global);

    console.time('render');
    renderer.render(data);
    console.timeEnd('render');

    utils.notification('complete!');
  }, 0);
}

// public api
pojoviz = {
  /**
   * holds a list of all the renderers available, shipped
   * with a d3 and a ThreeJS renderer
   */
  renderers: {},
  /**
   * Adds a renderer to the renderers available
   * @param newRenderers
   */
  addRenderers: function (newRenderers) {
    _.merge(pojoviz.renderers, newRenderers);
  },
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
  /**
   * Updates the value of the current renderer
   * @param r
   */
  setRenderer: function (r) {
    oldRenderer = renderer;
    renderer = pojoviz.renderers[r];
  },
  /**
   * Gets the current renderer
   * @returns {*}
   */
  getRenderer: function () {
    return renderer;
  },
  render: render,

  // expose inner modules
  ObjectAnalyzer: require('./ObjectAnalyzer'),
  InspectedInstances: require('./InspectedInstances'),
  analyzer: {
    Inspector: require('./analyzer/Inspector')
  },
  utils: require('./util'),

  // known configurations
  schemas: require('./schemas'),

  // used in search to save the downloaded configurations
  userVariables: []
};

// custom events
document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getCurrentInspector()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;