/* global d3 */
import { deepMerge } from '../../util/lodash-replacements'
import utils from '../../renderer/utils'
import pojoVizProperty from './Property'

const prefix = utils.prefixer
let margin = { top: 0, right: 0, left: 0, bottom: 0 }

function Node (parent) {
  const root = d3.select(parent.root).node()
  function my (selection) {
    // create
    const enter = selection.enter()

    function groupMouseBehavior (type) {
      const over = type === 'over'
      return function (d, i) {
        const hk = d.hashKey

        // hide all
        parent.opacityToggle(over)

        // select links
        root
          .selectAll('.' + prefix('to', hk))
          .classed('selected predecessor', over)
        root
          .selectAll('.' + prefix('from', hk))
          .classed('selected successor', over)

        // select current node
        root.select('.' + prefix(hk)).classed('selected current', over)

        // select predecessor nodes
        d.predecessors.forEach(function (v) {
          root.selectAll('.' + prefix(v)).classed('selected predecessor', over)
        })

        // select successor nodes
        d.successors.forEach(function (v) {
          root.selectAll('.' + prefix(v)).classed('selected successor', over)
        })
      }
    }

    const nodeEnter = enter
      .append('g')
      .attr('class', function (d) {
        // string,number,boolean.undefined,object,function
        // var type = d.label;
        return [prefix('node'), prefix(d.hashKey)].join(' ')
      })
      .attr('transform', function (d) {
        return utils.translate(d.x - d.width / 2, d.y - d.height / 2)
      })
      .on('mouseover', groupMouseBehavior('over'))
      .on('mouseout', groupMouseBehavior('out'))

    nodeEnter
      .append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('class', 'node-background')

    nodeEnter
      // .append('g')
      .append('text')
      .attr('class', prefix('title'))
      .attr('transform', 'translate(20, 25)')
      .text(function (d) {
        return d.label
      })

    // nodeEnter
    //   .append('text')
    //     .attr('class', 'title')
    //     .text(function (d) { return d.label; });

    const bodyEnter = nodeEnter.append('g').attr('class', prefix('body'))

    const propertyCtor = pojoVizProperty()
    propertyCtor.margin(margin)
    bodyEnter
      .selectAll('g.' + prefix('property'))
      .data(function (d) {
        d.properties.forEach(function (p) {
          p.label = d.label
        })
        return d.properties
      })
      .call(propertyCtor)

    // fix node background width/height
    selection.each(function (d, i) {
      const el = d3.select(this)
      const rect = el.select('rect.node-background')

      // setTimeout(function () {
      const bbox = el.node().getBBox()
      rect.attr('width', bbox.width + 20).attr('height', bbox.height + 20)
      // }, 0);
    })
  }
  my.margin = function (m) {
    if (!m) {
      return margin
    }
    margin = deepMerge(margin, m)
  }
  return my
}

export default Node
