define(['lib/lodash', 'util/utils', 'ObjectHashes', 'dagre', 'Canvas'],
  function (_, utils, ObjectHashes, dagre, Canvas) {

  var selectedHash = ObjectHashes.builtIn,
      oldSelectedHash,
      pojoviz;

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
      var label = k.match(/\S*?-(.*)/)[1];
      // console.log(k, label.length);
      node = {
        label: k,
        width: label.length * 10
      };
      properties = selectedHash.getProperties(v);

      // lines + header + padding bottom
      node.height = properties.length * 15 + 50;
      node.properties = properties;
      properties.forEach(function (v) {
        node.width = Math.max(node.width, v.name.length * 10);
      });
      // console.log(properties);
      // console.log(node);
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

    var layout = dagre.layout()
      .nodeSep(30)
      // .rankSep(70)
      // .rankDir('TB')
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

      nodes.push(node);
    });

    center.x /= (total || 1);
    center.y /= (total || 1);
    // console.log(center, mn, mx);
    // console.log(cx, cy, mn, mx);

    _.forOwn(registeredObjects, function (v, k) {
      selectedHash.getLinkDetails(v).forEach(function (info) {
        if (g.hasNode(info.fromHash) && g.hasNode(info.toHash)) {
          edges.push(info);
        }
      });
    });

    // layout.eachNode(function(u, value) {
    //   console.log("Node " + u + ": " + JSON.stringify(value));
    // });
    // layout.eachEdge(function(e, u, v, value) {
    //   console.log("Edge " + u + " -> " + v + ": " + JSON.stringify(value));
    // });

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

    if (selectedHash.dirty || oldSelectedHash !== selectedHash) {
      selectedHash.setDirty(false);
      
      if (canvas) {
        canvas.destroy();
      }
      
      console.time('process');
      t = new Date();
      preProcess();
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
    getSelectedHash: function () {
      return selectedHash;
    },
    setSelectedHash: function (k) {
      oldSelectedHash = selectedHash;
      selectedHash = ObjectHashes[k];
    },
    render: render
  };

  // custom events
  document.addEventListener('property-click', function (e) {
    var detail = e.detail;
    pojoviz
      .getSelectedHash()
      .showSearch(detail.name, detail.property);
    // console.log(detail.name, detail.property);
  });
  window.__jsonpCallbacks__ = {};
  
  // expose the app globally
  window.pojoviz = pojoviz;

  return pojoviz;
});