import dagre from 'dagre'
import iframe from 'iframe'

const pojoviz = window.pojoviz
const utils = pojoviz.utils

// the iframe created to append in the playground
let iFrameEl

let renderer
const draw = {
  renderers: {},

  /**
   * Given an inspector instance it build the graph and also the
   * layout of the nodes belonging to it, the resulting object is
   * an object which is used by a renderer to be drawn
   * @param {Inspector} inspector
   */
  process: function (inspector) {
    if (inspector.remote) {
      return this.doProcess(inspector.json)
    }
    return this.doProcess(inspector.analyzer.stringify())
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
    const g = new dagre.Digraph()
    let node
    const libraryLabels = nodesStringified.labels
    const libraryNodes = nodesStringified.nodes
    const libraryEdges = nodesStringified.edges

    // create the graph
    // each element of the graph has
    // - label
    // - width
    // - height
    // - properties
    for (const k in libraryNodes) {
      if (Object.prototype.hasOwnProperty.call(libraryNodes, k)) {
        const properties = libraryNodes[k]
        const label = libraryLabels[k][0].label
        node = {
          hashKey: k,
          label,
          width: label.length * 10
        }
        // lines + header + padding bottom
        node.height = properties.length * 15 + 50
        node.properties = properties
        properties.forEach(function (v) {
          node.width = Math.max(node.width, v.property.length * 10)
        })
        g.addNode(k, node)
      }
    }

    // build the edges from node to node
    for (const links of Object.values(libraryEdges)) {
      links.forEach(function (link) {
        if (g.hasNode(link.from) && g.hasNode(link.to)) {
          g.addEdge(null, link.from, link.to)
        }
      })
    }

    // generate the graph layout
    const layout = dagre
      .layout()
      .nodeSep(30)
      // .rankSep(70)
      // .rankDir('TB')
      .run(g)

    const nodes = []
    const edges = []
    const center = { x: 0, y: 0 }
    const mn = { x: Infinity, y: Infinity }
    const mx = { x: -Infinity, y: -Infinity }
    const total = g.nodes().length

    // update the node info adding:
    // - x (x-coordinate of the center of the node)
    // - y (y-coordinate of the center of the node)
    // - predecessors (an array with the identifiers of the predecessors of this node)
    // - successors (an array with the identifiers of the successor of this node)
    layout.eachNode(function (k, layoutInfo) {
      const x = layoutInfo.x
      const y = layoutInfo.y

      node = g.node(k)
      node.x = x
      node.y = y
      node.predecessors = g.predecessors(k)
      node.successors = g.successors(k)
      nodes.push(node)

      // calculate the bbox of the graph to center the graph
      const mnx = x - node.width / 2
      const mny = y - node.height / 2
      const mxx = x + node.width / 2
      const mxy = y + node.height / 2

      center.x += x
      center.y += y
      mn.x = Math.min(mn.x, mnx)
      mn.y = Math.min(mn.y, mny)
      // console.log(x, y, ' dim ', node.width, node.height);
      mx.x = Math.max(mx.x, mxx)
      mx.y = Math.max(mx.y, mxy)
    })

    center.x /= total || 1
    center.y /= total || 1

    // create the edges from property to node
    for (const links of Object.values(libraryEdges)) {
      links.forEach(function (link) {
        if (g.hasNode(link.from) && g.hasNode(link.to)) {
          edges.push(link)
        }
      })
    }

    return {
      edges,
      nodes,
      center,
      mn,
      mx
    }
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
    let data
    const me = this

    inspector = inspector || pojoviz.getCurrentInspector()
    renderer = renderer || pojoviz.draw.getCurrentRenderer()

    utils.notification('processing ' + inspector.entryPoint)
    utils.fireGlobalEvent('pojoviz-render-start')

    // pre render
    renderer.clear()

    setTimeout(function () {
      inspector.preRender()
      console.log('process & render start: ', new Date())
      // data:
      // - edges (property -> node)
      // - nodes
      // - center
      console.time('process')
      data = me.process(inspector)
      console.timeEnd('process')

      utils.notification(
        'rendering ' + (inspector.displayName || inspector.entryPoint)
      )

      console.time('render')
      renderer.render(data)
      console.timeEnd('render')

      utils.fireGlobalEvent('pojoviz-render-end')
      utils.notification('complete!')
    }, 0)
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
    if (!(value && typeof value === 'object')) {
      throw new Error('value is not an object')
    }
    if (!(value.clear && value.render)) {
      throw new Error('clear & render must be defined on object')
    }
    this.renderers[key] = value
  },

  /**
   * Updates the value of the current renderer
   * @param {string} r
   */
  setRenderer: function (r) {
    renderer = this.renderers[r]
  },

  /**
   * Gets a renderer by key
   * @param key
   * @returns {*}
   */
  getRenderer: function (key) {
    return this.renderers[key]
  },

  /**
   * Gets the current renderer
   * @returns {*}
   */
  getCurrentRenderer: function () {
    return renderer
  },

  createIFrame: function (selector) {
    iFrameEl = iframe({
      container: document.querySelector(selector)
    })
  },

  renderToIFrame: function (code) {
    iFrameEl.setHTML({
      src: '../public/playground.html',
      sandboxAttributes: ['allow-same-origin', 'allow-scripts']
    })
    // iframes are weird!
    const iframeWindow = iFrameEl.iframe.contentWindow
    iframeWindow.onload = function () {
      const doc = iframeWindow.document
      const script = doc.createElement('script')
      doc.head.appendChild(script)
      script.innerHTML = 'setTimeout(function(){\n;' + code + '\n;}, 0)'
    }
  }
}

export default draw
