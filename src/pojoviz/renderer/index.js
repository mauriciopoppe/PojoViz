import draw from "./draw";
import d3Renderer from "./d3/";
import threeRenderer from "./three/";

// it's not a standalone package
// but it extends pojoviz's functionality
const pojoviz = window.pojoviz;
if (!pojoviz) {
  throw "This is not a standalone project, pojoviz not found";
}

Object.assign(pojoviz, {
  draw: draw,
});

pojoviz.draw.addRenderer("d3", d3Renderer);
pojoviz.draw.addRenderer("three", threeRenderer);
pojoviz.draw.setRenderer("d3");

export default pojoviz.draw;

