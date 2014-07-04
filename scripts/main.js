/* global requirejs: false */
requirejs.config({
  baseUrl: 'scripts/app',
  paths: {
    lib: '../lib',
    dagre: '../lib/dagre'
  },
  shim: {
    dagre: {
      exports: 'dagre'
    }
  }
});

// app
window.dw = {};
requirejs(['lib/lodash', 'ObjectAnalyzer', 'dagre', 'Canvas'],
  function (_, ObjectAnalyzer, dagre, Canvas) {

  var canvas,
      oa = ObjectAnalyzer
        .levels(2)
        .init();

  // register objects
  function register(obj) {
    ObjectAnalyzer.register(obj);
  }

  function process() {
    var g = new dagre.Digraph(),
        properties,
        node,
        registeredObjects = ObjectAnalyzer.getObjects();
    
    _.forOwn(registeredObjects, function (v, k) {
      node = {
        label: k,
        width: 200
      };
      properties = ObjectAnalyzer.getProperties(v);
      node.height = properties.length * 15 + 30;
      node.properties = properties;
      // console.log(properties);
      g.addNode(k, node);
    });

    // console.log(ObjectAnalyzer.getLinks());
    _.forOwn(ObjectAnalyzer.getLinks(), function (v, k) {
      v.forEach(function (link) {
        if (g.hasNode(k) && g.hasNode(link)) {
          g.addEdge(null, k, link);
        }
      });
    });

    var layout = dagre
      .layout()
      .nodeSep(10)
      .run(g);

    // data
    var nodes = [],
        edges = [];
    layout.eachNode(function (k, layoutInfo) {
      node = g.node(k);
      node.x = layoutInfo.x;
      node.y = layoutInfo.y;
      nodes.push(node);
    });

    _.forOwn(registeredObjects, function (v, k) {
      ObjectAnalyzer.getLinkDetails(v).forEach(function (info) {
        if (g.hasNode(info.fromHash) && g.hasNode(info.toHash)) {
          edges.push(info);
        }
      });
    });

    return {
      edges: edges,
      nodes: nodes
    };
  }

  // render
  function render() {
    var data = process();
    if (canvas) {
      canvas.destroy();
    }
    canvas = new Canvas(data.nodes, data.edges);
    canvas.render();
  }

  window.dw = {
    register: register,
    render: render
  };
  window.dw.render();
});