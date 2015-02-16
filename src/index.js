var _ = require('lodash'),
  Q = require('q'),
  dagre = require('dagre'),
  utils = require('./util/'),
  ObjectHashes = require('./InspectedInstances');

// enable promise chain debug
Q.longStackSupport = true;

var container, oldContainer;
var renderer, oldRenderer;
var pojoviz;

/**
 *
 * @return {Object} [description]
 */
function process(container) {
  var g = new dagre.Digraph(),
      properties,
      node,
      library = container.analyzer,
      str = library.stringify(),
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
    // console.log(k, label.length);
    node = {
      label: k,
      width: label.length * 10
    };
    // lines + header + padding bottom
    node.height = properties.length * 15 + 50;
    node.properties = properties;
    properties.forEach(function (v) {
      node.width = Math.max(node.width, v.name.length * 10);
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

  // update the node info of the node adding:
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
  _(libraryEdges).forOwn(function (links) {
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

  if (container === oldContainer) {
    return;
  }

  utils.notification('processing ' + container.global);

  // pre render
  oldRenderer && oldRenderer.clean();
  renderer.clean();

  setTimeout(function () {
    container.preRender();
    console.log('process & render start: ', new Date());
    // data has
    // - edges (property -> node)
    // - nodes
    // - center
    //
    console.time('process');
    data = process(container);
    console.timeEnd('process');

    utils.notification('rendering ' + container.global);

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
  nullifyContainer: function () {
    oldContainer = container;
    container = null;
  },
  getContainer: function () {
    return container;
  },
  setContainer: function (containerName, options) {
    oldContainer = container;
    container = ObjectHashes[containerName];

    if (!container) {
      container = ObjectHashes.create(containerName, options);
    } else {
      // required to fetch external resources
      container.src = options.src;
    }

    return container.init();
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
  ObjectHashes: require('./InspectedInstances'),
  ObjectAnalyzer: require('./ObjectAnalyzer'),
  analyzer: {
    GenericAnalyzer: require('./analyzer/Inspector')
  },
  utils: require('./util'),

  // user vars
  userVariables: []
};

// custom events
document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getContainer()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;