import { uniqueId } from "../../util/lodash-replacements";
import utils from "../../renderer/utils";
import pojoVizNode from "./Node";
import pojoVizUtils from "../../util/";

let rootSvg;
const prefix = utils.prefixer;
const escapeCls = utils.escapeCls;
const hashCode = pojoVizUtils.hashCode;

function getX(d) {
  return d.x - d.width / 2;
}

function getY(d) {
  return d.y - d.height / 2;
}

class Canvas {
  constructor(data, el) {
    if (!el) {
      throw new Error("el must be provided");
    }
    this.id = uniqueId();
    this.data = data;
    this.createRoot(el);
    this.set({
      nodes: data.nodes,
      edges: data.edges,
    });
  }

  destroy() {
    this.data = null;
    rootSvg.selectAll("*").remove();
  }

  createRoot(el) {
    const root = d3.select(el);
    if (!root[0][0]) {
      throw new Error("canvas couldn't be selected");
    }
    root.selectAll("*").remove();
    rootSvg = root.append("svg");
    rootSvg.attr("style", "width: 100%; height: 100%");
    this.root = rootSvg.append("g").attr("class", "root-" + this.id);
  }

  set(obj, render) {
    this.nodes = obj.nodes;
    this.edges = obj.edges;
    if (render) {
      this.render();
    }
  }

  fixZoom() {
    const me = this;
    const scr = rootSvg.node();
    const bbox = this.root.node().getBBox();
    const screenWidth = scr.clientWidth;
    const screenHeight = scr.clientHeight;
    const canvasWidth = bbox.width;
    const canvasHeight = bbox.height;
    const sx = this.data.mn.x;
    const sy = this.data.mn.y;
    let scale = Math.min(
      screenWidth / canvasWidth,
      screenHeight / canvasHeight,
    );
    let translate;

    if (!isFinite(scale)) {
      scale = 0;
    }
    // change the scale proportionally to its proximity to zero
    scale -= scale / 10;

    translate = [
      -sx * scale + (screenWidth / 2 - (canvasWidth * scale) / 2),
      -sy * scale + (screenHeight / 2 - (canvasHeight * scale) / 2),
    ];

    function redraw() {
      const translation = d3.event.translate;
      const newX = translation[0];
      const newY = translation[1];
      me.root.attr(
        "transform",
        utils.transform({
          translate: [newX, newY],
          scale: [d3.event.scale],
        }),
      );
    }

    function zoomBehavior(type) {
      const start = type === "start";
      return function () {
        d3.select(this).classed("dragged", start);
      };
    }

    // console.log('center', translate);
    // console.log(scr.clientWidth, bbox.width, sx);
    const zoom = d3.behavior
      .zoom()
      .on("zoomstart", zoomBehavior("start"))
      .on("zoom", redraw)
      .on("zoomend", zoomBehavior("end"))
      .translate(translate)
      .scale(scale);

    rootSvg.call(zoom);

    me.root
      .attr(
        "transform",
        utils.transform({
          scale: [scale],
          translate: [
            -sx + (screenWidth / scale / 2 - canvasWidth / 2),
            -sy + (screenHeight / scale / 2 - canvasHeight / 2),
          ],
        }),
      )
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .attr("opacity", 1);
  }

  render() {
    this.renderNodes();
    this.renderEdges();
    this.fixZoom();
  }

  renderEdges() {
    const me = this;
    const edges = this.edges;

    // CREATE
    const diagonal = d3.svg
      .diagonal()
      .source(function (d) {
        const from = me.root.select("." + prefix(escapeCls(d.from)));
        if (!from.node()) {
          throw "source node must exist";
        }
        const fromData = from.datum();
        const property = from.select(
          "." + prefix(d.from, hashCode(d.property)),
        );
        const propertyData = d3.transform(property.attr("transform"));

        return {
          x: getY(fromData) + propertyData.translate[1] - 2,
          y: getX(fromData) + propertyData.translate[0] - 10,
        };
      })
      .target(function (d) {
        const to = me.root.select("." + prefix(escapeCls(d.to)));
        let toData, bbox;
        if (!to.node()) {
          throw "target node must exist";
        }
        toData = to.datum();
        return {
          x: getY(toData) + 10, // + bbox.height / 2,
          y: getX(toData), // + bbox.width / 2
        };
      })
      .projection(function (d) {
        return [d.y, d.x];
      });

    function mouseEvent(type) {
      const over = type === "over";
      return function (d) {
        d3.select(this).classed("selected", over);
      };
    }

    this.root
      .selectAll(".link")
      .data(edges)
      .enter()
      .append("path")
      .attr("class", function (d) {
        return [
          prefix("to", escapeCls(d.to)),
          prefix("from", escapeCls(d.from)),
          prefix("link"),
        ].join(" ");
      })
      .attr("stroke", "lightgray")
      .attr("stroke-opacity", 0.3)
      .attr("d", diagonal)
      .on("mouseover", mouseEvent("over"))
      .on("mouseout", mouseEvent("out"));
  }

  opacityToggle(decrease) {
    this.root.classed(prefix("nodes-focused"), decrease);
  }

  renderNodes() {
    const nodes = this.nodes;

    const nodeCtor = pojoVizNode(this);
    nodeCtor.margin({
      top: 10,
      left: 10,
      right: 10,
      bottom: 10,
    });
    const nodeGroup = this.root
      .selectAll(prefix("node"))
      .data(nodes)
      .call(nodeCtor);
  }
}

export default Canvas;
