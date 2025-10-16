/* global d3 */
import { uniqueId } from '../../util/lodash-replacements'
import utils from '../../renderer/utils'
import pojoVizNode from './Node'
import pojoVizUtils from '../../util/'

let rootSvg
let nodeConnectionDetails
const prefix = utils.prefixer
const escapeCls = utils.escapeCls
const hashCode = pojoVizUtils.hashCode

function segmentIntersection(p1, p2, p3, p4) {
  const x1 = p1.x,
    y1 = p1.y
  const x2 = p2.x,
    y2 = p2.y
  const x3 = p3.x,
    y3 = p3.y
  const x4 = p4.x,
    y4 = p4.y

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  if (denominator === 0) {
    return null // parallel
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    }
  }

  return null // no intersection within segments
}

function getX(d) {
  return d.x - d.width / 2
}

function getY(d) {
  return d.y - d.height / 2
}

class Canvas {
  constructor(data, el) {
    if (!el) {
      throw new Error('el must be provided')
    }
    this.id = uniqueId()
    this.data = data
    this.createRoot(el)
    this.set({
      nodes: data.nodes,
      edges: data.edges
    })
  }

  destroy() {
    this.data = null
    rootSvg.selectAll('*').remove()
  }

  createRoot(el) {
    const root = d3.select(el)
    if (!root[0][0]) {
      throw new Error("canvas couldn't be selected")
    }
    root.selectAll('*').remove()
    rootSvg = root.append('svg')
    rootSvg.attr('style', 'width: 100%; height: 100%')

    // Add marker definition
    rootSvg
      .append('defs')
      .selectAll('marker')
      .data(['arrow'])
      .enter()
      .append('marker')
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'gray')

    this.root = rootSvg.append('g').attr('class', 'root-' + this.id)
    this.addNodeConnectionDetails()
  }



  addNodeConnectionDetails() {
    const detailsWidth = 250
    const detailsHeight = 200

    const parentNode = rootSvg.node().parentNode
    if (!parentNode) {
      return
    }
    const screenWidth = parentNode.clientWidth
    const screenHeight = parentNode.clientHeight

    if (screenWidth === 0 || screenHeight === 0) {
      // Can't create details view if canvas is not visible
      return
    }

    // Position it in the bottom right corner
    const detailsX = screenWidth - detailsWidth - 20
    const detailsY = screenHeight - detailsHeight - 20

    nodeConnectionDetails = rootSvg
      .append('g')
      .attr('class', prefix('node-connection-details'))
      .attr('transform', `translate(${detailsX}, ${detailsY})`)
      .style('display', 'none')

    nodeConnectionDetails
      .append('rect')
      .attr('width', detailsWidth)
      .attr('height', detailsHeight)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', 'rgba(255, 255, 255, 0.9)')
      .style('stroke', '#ccc')

    const detailsContent = nodeConnectionDetails
      .append('foreignObject')
      .attr('width', detailsWidth)
      .attr('height', detailsHeight)
      .append('xhtml:div')
      .attr('class', 'details-content')
      .style('padding', '10px')

    detailsContent.append('div').attr('class', 'current-node')
    detailsContent.append('div').attr('class', 'predecessors')
    detailsContent.append('div').attr('class', 'successors')
  }

  showNodeConnectionDetails(nodeData) {
    if (!nodeConnectionDetails) {
      return
    }

    const predecessors = this.edges
      .filter((edge) => edge.to === nodeData.hashKey)
      .map((edge) => {
        const node = this.nodes.find((n) => n.hashKey === edge.from)
        return { name: node.label, property: edge.property }
      })

    const successors = this.edges
      .filter((edge) => edge.from === nodeData.hashKey)
      .map((edge) => {
        const node = this.nodes.find((n) => n.hashKey === edge.to)
        return { name: node.label, property: edge.property }
      })

    const currentNodeHtml = '<b>Current Node:</b> ' + nodeData.label
    const predecessorsHtml =
      '<b>Predecessors:</b>' +
      (predecessors.length
        ? '<ul>' + predecessors.map((p) => `<li>${p.name} (${p.property})</li>`).join('') + '</ul>'
        : ' None')
    const successorsHtml =
      '<b>Successors:</b>' +
      (successors.length
        ? '<ul>' + successors.map((s) => `<li>${s.name} (${s.property})</li>`).join('') + '</ul>'
        : ' None')

    const detailsContent = nodeConnectionDetails.select('.details-content')
    detailsContent.select('.current-node').html(currentNodeHtml)
    detailsContent.select('.predecessors').html(predecessorsHtml)
    detailsContent.select('.successors').html(successorsHtml)

    nodeConnectionDetails.style('display', 'block')
  }

  hideNodeConnectionDetails() {
    if (nodeConnectionDetails) {
      nodeConnectionDetails.style('display', 'none')
    }
  }

  set(obj, render) {
    this.nodes = obj.nodes
    this.edges = obj.edges
    if (render) {
      this.render()
    }
  }

  fixZoom() {
    const me = this
    const scr = rootSvg.node()
    const bbox = this.root.node().getBBox()
    const screenWidth = scr.clientWidth
    const screenHeight = scr.clientHeight
    const canvasWidth = bbox.width
    const canvasHeight = bbox.height
    const sx = this.data.mn.x
    const sy = this.data.mn.y
    let scale = Math.min(screenWidth / canvasWidth, screenHeight / canvasHeight)
    const translate = [
      -sx * scale + (screenWidth / 2 - (canvasWidth * scale) / 2),
      -sy * scale + (screenHeight / 2 - (canvasHeight * scale) / 2)
    ]

    if (!isFinite(scale)) {
      scale = 0
    }
    // change the scale proportionally to its proximity to zero
    scale -= scale / 10

    function redraw() {
      const translation = d3.event.translate
      const newX = translation[0]
      const newY = translation[1]
      me.root.attr(
        'transform',
        utils.transform({
          translate: [newX, newY],
          scale: [d3.event.scale]
        })
      )
    }

    function zoomBehavior(type) {
      const start = type === 'start'
      return function () {
        d3.select(this).classed('dragged', start)
      }
    }

    // console.log('center', translate);
    // console.log(scr.clientWidth, bbox.width, sx);
    const zoom = d3.behavior
      .zoom()
      .on('zoomstart', zoomBehavior('start'))
      .on('zoom', redraw)
      .on('zoomend', zoomBehavior('end'))
      .translate(translate)
      .scale(scale)

    rootSvg.call(zoom)

    me.root
      .attr(
        'transform',
        utils.transform({
          scale: [scale],
          translate: [
            -sx + (screenWidth / scale / 2 - canvasWidth / 2),
            -sy + (screenHeight / scale / 2 - canvasHeight / 2)
          ]
        })
      )
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .attr('opacity', 1)
  }

  render() {
    this.renderNodes()
    this.renderEdges()
    this.fixZoom()
  }

  renderEdges() {
    const me = this
    const edges = this.edges

    const sourceAccessor = function (d) {
      const from = me.root.select('.' + prefix(escapeCls(d.from)))
      if (!from.node()) {
        throw new Error('source node must exist')
      }
      const fromData = from.datum()
      const property = from.select('.' + prefix(d.from, hashCode(d.property)))
      const propertyData = d3.transform(property.attr('transform'))

      return {
        x: getX(fromData) + propertyData.translate[0] - 10,
        y: getY(fromData) + propertyData.translate[1] - 2
      }
    }

    function getTargetPoint(d, sourcePoint) {
      const toNode = me.root.select('.' + prefix(escapeCls(d.to)))
      if (!toNode.node()) {
        throw new Error('target node must exist')
      }
      const toData = toNode.datum()

      const targetCenter = { x: toData.x, y: toData.y }

      const x_left = getX(toData)
      const y_top = getY(toData)
      const x_right = getX(toData) + toData.width
      const y_bottom = getY(toData) + toData.height

      const nodeSegments = [
        [
          { x: x_left, y: y_top },
          { x: x_right, y: y_top }
        ], // top
        [
          { x: x_right, y: y_top },
          { x: x_right, y: y_bottom }
        ], // right
        [
          { x: x_right, y: y_bottom },
          { x: x_left, y: y_bottom }
        ], // bottom
        [
          { x: x_left, y: y_bottom },
          { x: x_left, y: y_top }
        ] // left
      ]

      let intersectionPoint = targetCenter
      for (const segment of nodeSegments) {
        const intersection = segmentIntersection(sourcePoint, targetCenter, segment[0], segment[1])
        if (intersection) {
          intersectionPoint = intersection
          break
        }
      }
      return intersectionPoint
    }

    const line = d3.svg
      .line()
      .x((d) => d.x)
      .y((d) => d.y)

    function mouseEvent(type) {
      const over = type === 'over'
      return function () {
        d3.select(this).classed('selected', over)
      }
    }

    this.root
      .selectAll('.link')
      .data(edges)
      .enter()
      .append('path')
      .attr('class', function (d) {
        return [prefix('to', escapeCls(d.to)), prefix('from', escapeCls(d.from)), prefix('link')].join(' ')
      })
      .attr('stroke', 'lightgray')
      .attr('stroke-opacity', 0.3)
      .attr('d', function (d) {
        const sourcePoint = sourceAccessor(d)
        const targetPoint = getTargetPoint(d, sourcePoint)
        return line([sourcePoint, targetPoint])
      })
      .attr('marker-end', 'url(#arrow)')
      .on('mouseover', mouseEvent('over'))
      .on('mouseout', mouseEvent('out'))
  }

  opacityToggle(decrease) {
    this.root.classed(prefix('nodes-focused'), decrease)
  }

  renderNodes() {
    const nodes = this.nodes

    const nodeCtor = pojoVizNode(this)
    nodeCtor.margin({
      top: 10,
      left: 10,
      right: 10,
      bottom: 10
    })
    this.root.selectAll(prefix('node')).data(nodes).call(nodeCtor)
  }
}

export default Canvas
