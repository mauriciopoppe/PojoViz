import Canvas from './Canvas'

let canvas
let canvasEl

const d3Renderer = {
  clear: function () {
    if (canvas) {
      canvas.destroy()
    }
  },
  render: function (data) {
    canvas = new Canvas(data, canvasEl)
    canvas.render()
  },
  setCanvasEl: function (el) {
    canvasEl = el
  }
}

// custom events
window.document &&
  document.addEventListener('property-click', function (e) {
    const detail = e.detail
    window.pojoviz
      .getCurrentInspector()
      .showSearch(detail.name, detail.property)
  })

export default d3Renderer
