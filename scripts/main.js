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
requirejs(['lib/lodash', 'ObjectAnalyzer', 'dagre', 'Canvas'],
  function (_, ObjectAnalyzer, dagre, Canvas) {

  var canvas,
      oa = ObjectAnalyzer
        // .levels(10)
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
        edges = [],
        center = {x: 0, y: 0},
        mn = {x: Infinity, y: Infinity},
        mx = {x: -Infinity, y: -Infinity},
        total = g.nodes().length;
    layout.eachNode(function (k, layoutInfo) {
      var x = layoutInfo.x;
      var y = layoutInfo.y;

      node = g.node(k);
      node.x = x;
      node.y = y;
      node.predecessors = g.predecessors(k);

      center.x += x;
      center.y += y;
      mn.x = Math.min(mn.x, x);
      mn.y = Math.min(mn.y, y);
      mx.x = Math.max(mx.x, x);
      mx.y = Math.max(mx.y, y);

      nodes.push(node);
    });

    center.x /= total;
    center.y /= total;

    // console.log(cx, cy, mn, mx);

    _.forOwn(registeredObjects, function (v, k) {
      ObjectAnalyzer.getLinkDetails(v).forEach(function (info) {
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
  function render() {
    var t = new Date();
    var data = process();
    console.log('process: ' + (new Date() - t));
    
    t = new Date();
    if (canvas) {
      canvas.destroy();
    }
    canvas = new Canvas(data);
    canvas.render();
    console.log('render: ' + (new Date() - t));
  }

  window.pojoviz = {
    register: register,
    render: render
  };
  window.pojoviz.render();
});