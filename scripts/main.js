/* global requirejs: false */
requirejs.config({
  baseUrl: 'scripts/app',
  paths: {
    angular: '../../bower_components/angular/angular',
    lib: '../lib',
    dagre: '../lib/dagre'
  },
  shim: {
    dagre: {
      exports: 'dagre'
    },
    angular: {
      exports: 'angular'
    }
  }
});

// app
requirejs(['../pojoviz'], function (pojoViz) {
  // pojoViz.render();
});