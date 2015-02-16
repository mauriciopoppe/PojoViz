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
 *
 * @return {Object} [description]
 */
function process(inspector) {
  var g = new dagre.Digraph(),
      node,
      analyzer = inspector.analyzer,
      str = analyzer.stringify(),
      libraryNodes = str.nodes,
      libraryEdges = str.edges;

  //console.log(str);
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

  // layout of the graph
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
  // - x
  // - y
  // - predecessors
  // - successors
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

// render
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
  renderers: {},
  addRenderers: function (newRenderers) {
    _.merge(pojoviz.renderers, newRenderers);
  },
  unsetInspector: function () {
    oldInspector = inspector;
    inspector = null;
  },
  getCurrentInspector: function () {
    return inspector;
  },
  /**
   *
   * @param options
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
  setRenderer: function (r) {
    oldRenderer = renderer;
    renderer = pojoviz.renderers[r];
  },
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
  utils: require('./util')
};

// custom events
document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getCurrentInspector()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;