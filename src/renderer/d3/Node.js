var _ = require('lodash'),
  d3 = require('d3'),
  utils = require('../../util/'),
  pojoVizProperty = require('./Property'),
  hashKey = require('../../util/hashKey');

var prefix = utils.prefixer;
var escapeCls = utils.escapeCls;
var margin = { top: 0, right: 0, left: 0, bottom: 0 };

function Node(parent) {

  function my(selection) {
    // create
    var enter = selection.enter();

    function groupMouseBehavior(type) {
      var over = type === 'over';
      return function (d, i) {
        var labelEscaped = escapeCls(d.label);

        // hide all
        parent.opacityToggle(over);

        // select links
        d3.selectAll('.' + prefix('to', labelEscaped))
          .classed('selected predecessor', over);
        d3.selectAll('.' + prefix('from', labelEscaped))
          .classed('selected successor', over);

        // select current node
        d3.select('.' + prefix(labelEscaped))
          .classed('selected current', over);

        // select predecessor nodes
        d.predecessors
          .forEach(function (v) {
            d3.selectAll('.' + prefix(escapeCls(v)))
              .classed('selected predecessor', over);
          });

        // select successor nodes
        d.successors
          .forEach(function (v) {
            d3.selectAll('.' + prefix(escapeCls(v)))
              .classed('selected successor', over);
          });
      };
    }

    var nodeEnter = enter
      .append('g')
      .attr('class', function (d) {
        var type = d.label
          .match(/^(\w)*/);
        return [
          prefix('node'),
          prefix(type[0]),
          prefix(escapeCls(d.label))
        ].join(' ');
      })
      .attr('transform', function (d) {
        return utils.translate(
          d.x - d.width / 2,
          d.y - d.height / 2
        );
      })
      .on('mouseover', groupMouseBehavior('over'))
      .on('mouseout', groupMouseBehavior('out'));

    nodeEnter
      .append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('class', 'node-background');

    nodeEnter
      // .append('g')
      .append('text')
        .attr('class', prefix('title'))
        .attr('transform', 'translate(20, 25)')
        .text(function (d) {
          var name = d.label
            .match(/\S*?-(.*)/)[1]
            .replace('-', '.');
          return name;
        });

    // nodeEnter
    //   .append('text')
    //     .attr('class', 'title')
    //     .text(function (d) { return d.label; });

    var bodyEnter = nodeEnter
      .append('g')
        .attr('class', prefix('body'));

    var propertyCtor = pojoVizProperty();
    propertyCtor.margin(margin);
    bodyEnter.selectAll('g.' + prefix('property'))
      .data(function (d) {
        d.properties.forEach(function (p) {
          p.label = d.label;
        });
        return d.properties;
      })
      .call(propertyCtor);

    // fix node background width/height
    selection.each(function (d, i) {
      var el = d3.select(this),
          rect = el.select('rect.node-background');

      // setTimeout(function () {
      var bbox = el.node().getBBox();
      rect
        .attr('width', bbox.width + 10 * 2)
        .attr('height', bbox.height + 10);
      // }, 0);
    });
  }
  my.margin = function (m) {
    if (!m) {
      return margin;
    }
    margin = _.merge(margin, m);
  };
  return my;
}

module.exports = Node;