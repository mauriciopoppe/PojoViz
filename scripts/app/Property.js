define(['lib/d3', 'util/d3utils', 'lib/lodash'],
    function (d3, utils, _) {

  var prefix = utils.prefixer;
  var transformProperty = utils.transformProperty;

  function Property() {
    var margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    var titleHeight = 40;

    function my(selection) {

      function propertyY(d, i) {
        return [
          margin.left + 10,
          margin.top + titleHeight + i * 15
        ];
      }

      // PROPERTY CREATE
      function mouseEvent(type) {
        var over = type === 'over';
        return function (d, i) {
          d3.select(this)
            .transition()
              .duration(300)
              .attr('transform', function () {
                return utils.transform({
                  translate: propertyY(d, i),
                  scale: [over ? 1.5 : 1]
                });
              });
        };
      }
      var propertyEnter = selection.enter()
          .append('g')
          .attr('class', function (d) {
            return [
              prefix('property'),
              prefix(transformProperty(d.name))
            ].join(' ');
          })
          .attr('transform', function (d, i) {
            return utils.transform({
              translate: propertyY(d, i)
            });
          })
          .on('mouseover', mouseEvent('over'))
          .on('mouseout', mouseEvent('out'));

      propertyEnter
        .append('text')
        .attr('font-size', 10)
        .attr('text-anchor', 'start')
        .attr('class', function (d) {
          return [
            prefix('key')
          ].join(' ');
        })
        .text(function (d, i) {
          return d.name;
        })
        .on('click', function (d, i) {
          var link = d.cls.match(/\S*?-(\w*)/);
          console.log(link);
          window.open('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/' +
            link[1] + '/' + d.name);
        });

      propertyEnter
        .insert('rect', 'text')
        .attr('class', function (d) {
          return [
            prefix(d.type),
            prefix('property', 'background')
          ].join(' ');
        })
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('x', -2)
        .attr('y', -9)
        .attr('height', function (d) {
          var text = d3
            .select(this.parentNode)
            .select('text');
          return text.property('clientHeight');
        })
        .attr('width', function (d) {
          var text = d3
            .select(this.parentNode)
            .select('text');
          return text.property('clientWidth') + 5;
        });

      propertyEnter.each(function (d) {
        if (d.type === 'object') {
          d3.select(this)
            .append('circle')
            .attr('r', 4)
            .attr('fill', 'purple')
            .attr('cx', -10)
            .attr('cy', -2)
            .attr('opacity', 1);
        }
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

  return Property;
});