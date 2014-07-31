var _ = require('lodash'),
  dagre = require('dagre'),
  utils = require('./util/'),
  ObjectHashes = require('./ObjectHashes'),
  Canvas = require('./view/Canvas');

var library = ObjectHashes.builtIn,
  oldLibrary,
  pojoviz;

function process() {
  var g = new dagre.Digraph(),
      properties,
      node,
      registeredObjects = library.getObjects();
  
  // create the graph
  // each element of the graph has
  // - label
  // - width
  // - height
  // - properties
  _.forOwn(registeredObjects, function (v, k) {
    var label = k.match(/\S*?-(.*)/)[1];
    // console.log(k, label.length);
    node = {
      label: k,
      width: label.length * 10
    };
    properties = library.getProperties(v);

    // lines + header + padding bottom
    node.height = properties.length * 15 + 50;
    node.properties = properties;
    properties.forEach(function (v) {
      node.width = Math.max(node.width, v.name.length * 10);
    });
    g.addNode(k, node);
  });

  // build the edges from node to node
  _.forOwn(library.getLinks(), function (v, k) {
    v.forEach(function (link) {
      if (g.hasNode(k) && g.hasNode(link)) {
        g.addEdge(null, k, link);
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
  _.forOwn(registeredObjects, function (v, k) {
    library.getLinkDetails(v).forEach(function (info) {
      if (g.hasNode(info.fromHash) && g.hasNode(info.toHash)) {
        edges.push(info);
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
var canvas,
    cached;
function render() {
  var t,
      data;

  if (library.dirty || oldLibrary !== library) {
    library.setDirty(false);
    
    if (canvas) {
      canvas.destroy();
    }
    console.log('rendering')
    console.time('process');
    t = new Date();
    library.preRender();
    // data has
    // - edges (property -> node)
    // - nodes
    // - center
    // 
    data = process();
    console.timeEnd('process');
    
    console.time('render');
    canvas = new Canvas(data);
    canvas.render();
    console.timeEnd('render');
  }
  cached = data;
}

// public api
pojoviz = {
  getCurrentLibrary: function () {
    return library;
  },
  setCurrentLibrary: function (k) {
    oldLibrary = library;
    library = ObjectHashes[k];
  },
  render: render,

  // expose inner modules
  analyzer: {
    angular: require('./analyzer/angularAnalyzer'),
    builtIn: require('./analyzer/builtInAnalyzer'),
    d3: require('./analyzer/d3Analyzer')
  },
  ObjectHashes: require('./ObjectHashes'),
  ObjectAnalyzer: require('./ObjectAnalyzer')
};

// custom events
document.addEventListener('property-click', function (e) {
  var detail = e.detail;
  pojoviz
    .getCurrentLibrary()
    .showSearch(detail.name, detail.property);
});

module.exports = pojoviz;