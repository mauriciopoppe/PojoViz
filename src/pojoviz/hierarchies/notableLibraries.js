/**
 * Created by mauricio on 2/17/15.
 */
export default [
  {
    src: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js",
    entryPoint: "jQuery",
  },
  {
    entryPoint: "d3",
  },
  {
    label: "Lo-Dash",
    entryPoint: "_",
    src: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js",
  },
  {
    src: "https://unpkg.com/react@18/umd/react.development.js",
    entryPoint: "React",
    analyzerConfig: {
      levels: 1,
    },
  },
  {
    src: "//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.js",
    entryPoint: "angular",
    label: "Angular JS",
  },
  {
    src: "//cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.2/modernizr.js",
    entryPoint: "Modernizr",
  },
  {
    src: "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.1.2/handlebars.js",
    entryPoint: "Handlebars",
  },
  {
    src: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js|//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone.js",
    entryPoint: "Backbone",
  },
  {
    label: "Marionette.js",
    src: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js|//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.js|//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone.js|http://marionettejs.com/downloads/backbone.marionette.js",
    entryPoint: "Marionette",
  },
];
