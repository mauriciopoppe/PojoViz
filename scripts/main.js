/* global requirejs: false */
requirejs.config({
  baseUrl: 'scripts/app',
  paths: {
    lib: '../lib',
    dagre: '../lib/dagre'
  },
  shim: {
    dagre: {
      exports: 'dagre'
    }
  }
});

// app
requirejs(['../pojoviz'], function (pojoViz) {
  pojoViz.render();
});