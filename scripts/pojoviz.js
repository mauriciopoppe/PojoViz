define(['lib/lodash', 'ObjectHashes', 'dagre', 'Canvas'],
  function (_, ObjectHashes, dagre, Canvas) {

  var selectedHash = ObjectHashes.builtIn,
      oldSelectedHash;

  function remove(objects, withPrototype) {
    selectedHash.forbidObjects(
      objects, withPrototype
    );
  }

  function preProcess() {
    selectedHash.preRender();
  }

  function process() {
    var g = new dagre.Digraph(),
        properties,
        node,
        registeredObjects = selectedHash.getObjects();
    
    _.forOwn(registeredObjects, function (v, k) {
      node = {
        label: k,
        width: 200
      };
      properties = selectedHash.getProperties(v);
      node.height = properties.length * 15 + 30;
      node.properties = properties;
      // console.log(properties);
      g.addNode(k, node);
    });

    // console.log(selectedHash.getLinks());
    _.forOwn(selectedHash.getLinks(), function (v, k) {
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
      node.successors = g.successors(k);

      center.x += x;
      center.y += y;
      mn.x = Math.min(mn.x, x);
      mn.y = Math.min(mn.y, y);
      mx.x = Math.max(mx.x, x);
      mx.y = Math.max(mx.y, y);

      nodes.push(node);
    });

    center.x /= (total || 1);
    center.y /= (total || 1);

    // console.log(cx, cy, mn, mx);

    _.forOwn(registeredObjects, function (v, k) {
      selectedHash.getLinkDetails(v).forEach(function (info) {
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

    if (selectedHash.dirty() || oldSelectedHash !== selectedHash) {
      selectedHash.dirty(false);
      
      t = new Date();
      preProcess();
      data = process();
      console.log('process: ' + (new Date() - t));
      
      t = new Date();
      if (canvas) {
        canvas.destroy();
      }
      canvas = new Canvas(data);
      canvas.render();
      console.log('render: ' + (new Date() - t));
    }
    cached = data;
  }

  var pojoviz = {
    // objectHashes: selectedHash,
    getSelectedHash: function () {
      return selectedHash;
    },
    setSelectedHash: function (k) {
      oldSelectedHash = selectedHash;
      selectedHash = ObjectHashes[k];
    },
    render: render
  };
  
  // expose the app globally
  window.pojoviz = pojoviz;

  return pojoviz;
});