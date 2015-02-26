PojoViz - Plain Old JavaScript Object Visualization [![Build Status](https://travis-ci.org/maurizzzio/PojoViz.svg?branch=master)](https://travis-ci.org/maurizzzio/PojoViz)
=======

%PojoViz is a tool to analyze the plain objects of a JavaScript object hierarchy by finding all the relationships found between the hierarchy entry point (in most libraries/frameworks a global variable) and the objects/functions linked to it.

Note: this webpage uses <a href="http://caniuse.com/shadowdom">Shadow DOM</a>, it's suggested that you use a browser that supports this technology for a complete experience.

## Why?

How many times did you find an awesome library/framework and wanted to see how it's structured just for fun?

## Features

- Renders the hierarchy of the browser's built in objects (Object, Function, etc)
- Renders the hierarchy of Node global objects (process, Buffer, etc)
- Renders a library/framework hosted anywhere through the Library Search widget (as long as there is a way to access it, e.g. for d3 `window.d3` would be the access point to the library)

## Development

TODO
See [development]

## Changelog

v0.1.3

- Fixed a problem with the `hashKey` function that didn't create a hidden key in some objects
- Added some development notes in this file

v0.1.2

- Dagre is now in the pojoviz-vendor bundle

v0.1.1

- Improvements in the build system
- %PojoViz is now available through bower

v0.1.0

- Initial release

## TODO list

- Render NodeJS global objects
- Render NodeJS packages
- Create a dev tutorial on how to visualize libraries
- Render scope variables analyzing the ast (see Esprima)
- Move to the selected object on dot click
- Undo/redo

## Screenshots
<img class="center" src="http://f.cl.ly/items/0s2I0u2t2y1x2N3o0n2P/pojoviz-search.mov.gif" alt="">
<img class="center" src="http://f.cl.ly/items/1h1Y1b1y3z363T1d0U3z/pojovizthree.mov.gif" alt="">

## Acknowledgments

Special thanks once again to [@mrdoob](https://twitter.com/mrdoob) the author of [three.js](http://threejs.org/) and to [@mbostock](https://twitter.com/mbostock) author of [d3](https://github.com/mbostock/d3).

## Technologies used in this project

- [three.js](http://threejs.org/)
- [d3](http://d3js.org/)
- [Polymer](http://www.polymer-project.org/)
- [Browserify](http://browserify.org/)
- [Dagre](https://github.com/cpettitt/dagre)
- [Gulp](http://gulpjs.com/)
- [marked](https://github.com/chjj/marked)
- [t3](http://maurizzzio.github.io/t3/docs/)

----
[development]: https://github.com/maurizzzio/PojoViz/