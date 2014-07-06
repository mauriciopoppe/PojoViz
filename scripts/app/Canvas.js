define(['lib/d3', 'lib/lodash', 'util/d3utils', 'Node'],
    function (d3, _, utils, pojoVizNode) {
  var svg = d3.select('svg.canvas');
  var prefix = utils.prefixer;
  var transformProperty = utils.transformProperty;

  function Canvas(data) {
    this.id = _.uniqueId();
    this.createRoot(data.center, data.mn, data.mx);
    this.set({
      nodes: data.nodes,
      edges: data.edges
    });
  }

  Canvas.prototype.destroy = function() {
    svg
      .selectAll('*')
      .remove();
  };

  Canvas.prototype.createRoot = function(center, mn, mx) {
    var me = this;

    function redraw() {
      var translation = d3.event.translate,
          newX = translation[0],
          newY = translation[1];
      me.root.attr('transform',
        utils.transform({
          translate: [newX, newY],
          scale: [d3.event.scale]
        })
      );
    }

    function zoomBehavior(type) {
      var start = type === 'start';
      return function () {
        d3.select(this).classed('dragged', start);
      };
    }

    var scale = window.innerWidth / (mx.x - mn.x),
        translate = [-center.x, -center.y];

    var zoom = d3.behavior.zoom()
      .on('zoomstart', zoomBehavior('start'))
      .on('zoom', redraw)
      .on('zoomend', zoomBehavior('end'))
      .scale(scale);
      // .translate(translate);

    this.root = svg
      .call(zoom)
      .append('g')
        .attr('class', 'root-' + this.id)
        .attr('transform', utils.transform({
          scale: [scale]
        }));
  };

  Canvas.prototype.set = function(obj, render) {
    this.nodes = obj.nodes;
    this.edges = obj.edges;
    if (render) {
      this.render();
    }
  };

  Canvas.prototype.render = function() {
    this.renderNodes();
    this.renderEdges();
  };

  Canvas.prototype.renderEdges = function() {
    var me = this,
        edges = this.edges;
    
    // CREATE
    var diagonal = d3.svg.diagonal()
    .source(function(d) {
      var from = me.root.select('.' + prefix(d.fromHash)),
          fromData = from.datum(),
          property = from.select('.' + prefix(
            transformProperty(d.property)
          )),
          propertyData = d3.transform(property.attr('transform'));

      return {
        x: fromData.y + propertyData.translate[1] - 2,
        y: fromData.x + propertyData.translate[0] - 10
      };
    })
    .target(function(d) {
      var to = me.root.select('.' + prefix(d.toHash)),
          toData, bbox;
      if (!to.node()) {
        debugger;
      }
      toData = to.datum();
      bbox = to.node().getBBox();
      return {
        x: toData.y + 10,// + bbox.height / 2,
        y: toData.x// + bbox.width / 2
      };
    })
    .projection(function(d) {
      return [d.y, d.x];
    });

    function mouseEvent(type) {
      var over = type === 'over';
      return function (d) {
        d3.select(this)
          .classed('selected', over);
      };
    }

    var e = this.root.selectAll('.link')
        .data(edges)
      .enter()
        .append('path')
        .attr('class', function (d) {
          return [
            prefix('to', d.toHash),
            prefix('from', d.fromHash),
            prefix('link')
          ].join(' ');
        })
        .attr('stroke', 'lightgray')
        .attr('stroke-opacity', 0.3)
        .attr('d', diagonal)
        .on('mouseover', mouseEvent('over'))
        .on('mouseout', mouseEvent('out'));
  };

  Canvas.prototype.opacityToggle = function(decrease) {
    this.root
      .classed(prefix('nodes-focused'), decrease);
  };

  Canvas.prototype.renderNodes = function() {
    var nodes = this.nodes;
    
    var nodeCtor = pojoVizNode(this);
    nodeCtor.margin({
      top: 10,
      left: 10,
      right: 10,
      bottom: 10
    });
    var nodeGroup = this.root.selectAll(prefix('node'))
      .data(nodes)
      .call(nodeCtor);
  };

  return Canvas;
});