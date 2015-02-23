/**
 * Created by mauricio on 2/18/15.
 */
var dagre = require('dagre');
var assert = require('assert');
var _ = require('lodash');
var pojoviz = global.pojoviz;
var utils = pojoviz.utils;

var renderer;
module.exports = {
  renderers: {},

  /**
   * Given an inspector instance it build the graph and also the
   * layout of the nodes belonging to it, the resulting object is
   * an object which is used by a renderer to be drawn
   * @param {Inspector} inspector
   */
  process: function (inspector) {
    if (inspector.remote) {
      return this.doProcess(inspector.stringified);
    }
    return this.doProcess(inspector.analyzer.stringify());
  },
  /**
   * @param {object} nodesStringified An object with the following properties
   *  {
   *    nodes: [{}, ..] each object is generated in ObjectAnalyzer#stringify,
   *    edges: [{}, ..] each object is generated in ObjectAnalyzer#stringify
   *  }
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
  doProcess: function (nodesStringified) {
    var g = new dagre.Digraph(),
      node,
      libraryLabels = nodesStringified.labels,
      libraryNodes = nodesStringified.nodes,
      libraryEdges = nodesStringified.edges;

    // create the graph
    // each element of the graph has
    // - label
    // - width
    // - height
    // - properties
    _.forOwn(libraryNodes, function (properties, k) {
      var label = libraryLabels[k][0].label;
      node = {
        hashKey: k,
        label: label,
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
  },

  /**
   * Draws the current inspector in the canvas with the following steps:
   *
   * - clears the canvas
   * - processes the data of the current inspector
   * - renders the data produced by the method above
   * - notifies the user of any action performed
   *
   * @param {Inspector} [inspector]
   * @param {Object} [renderer]
   */
  render: function (inspector, renderer) {
    var data;
    var me = this;

    inspector = inspector || pojoviz.getCurrentInspector();
    renderer = renderer || pojoviz.draw.getCurrentRenderer();

    utils.notification('processing ' + inspector.entryPoint);

    // pre render
    renderer.clear();

    setTimeout(function () {
      inspector.preRender();
      console.log('process & render start: ', new Date());
      // data:
      // - edges (property -> node)
      // - nodes
      // - center
      console.time('process');
      data = me.process(inspector);
      console.timeEnd('process');

      utils.notification('rendering ' + (inspector.displayName || inspector.entryPoint));

      console.time('render');
      renderer.render(data);
      console.timeEnd('render');

      utils.notification('complete!');
    }, 0);
  },

  /**
   * Adds a renderer to the available renderers
   * @param {string} key
   * @param {Object} value It needs to have the following methods:
   *  - clear
   *  - render
   */
  addRenderer: function (key, value) {
    // the renderer must be an object and have the following methods:
    // - render
    // - clear
    assert(value && typeof value === 'object', 'value is not an object');
    assert(value.clear && value.render, 'clear & render must be defined on object');
    this.renderers[key] = value;
  },

  /**
   * Updates the value of the current renderer
   * @param {string} r
   */
  setRenderer: function (r) {
    renderer = this.renderers[r];
  },

  /**
   * Gets a renderer by key
   * @param key
   * @returns {*}
   */
  getRenderer: function (key) {
    return this.renderers[key];
  },

  /**
   * Gets the current renderer
   * @returns {*}
   */
  getCurrentRenderer: function () {
    return renderer;
  }
};