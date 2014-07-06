define(['lib/lodash', 'lib/d3', 'util/d3utils', 'Property',
    'util/hashKey', 'ObjectAnalyzer'],
  function (_, d3, utils, pojoVizProperty, hashKey, oa) {

  var prefix = utils.prefixer;
  var margin = { top: 0, right: 0, left: 0, bottom: 0 };

  function Node(parent) {

    function my(selection) {
      // create
      var enter = selection.enter();

      function groupBehavior(type) {
        var over = type === 'over';
        return function (d, i) {
          // hide all
          parent.opacityToggle(over);

          // select links
          d3.selectAll('.' + prefix('to', d.label))
            .classed('selected', over);

          // select nodes
          d.predecessors
            .concat([d.label])
            .forEach(function (v) {
              d3.selectAll('.' + prefix(v))
                .classed('selected', over);
            });
        };
      };

      var nodeEnter = enter
        .append('g')
        .attr('class', function (d) {
          return [prefix('node'), prefix(d.label)].join(' ');
        })
        .attr('transform', function (d) {
          return utils.translate(d.x, d.y);
        })        
        .on('mouseover', groupBehavior('over'))
        .on('mouseout', groupBehavior('out'));
      
      nodeEnter
        .append('rect')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('class', 'node-background');

      nodeEnter
        .append('g')
          .attr('class', prefix('title'))
          .attr('transform', 'translate(20, 25)')
        .append('text')
          .text(function (d) {
            var name = d.label
              .match(/\S*?-([\w-]*)/)[1]
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
        .data(function (d) { return d.properties; })
        .call(propertyCtor);

      // update the height & width of the rects
      selection.each(function (d, i) {
        var el = d3.select(this),
            rect = el.select('rect.node-background');

        var bbox = el.node().getBBox();
        rect
          .attr('width', bbox.width + 10 * 2)
          .attr('height', bbox.height + 10);
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

  return Node;
});