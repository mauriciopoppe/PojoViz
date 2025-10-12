PojoViz - Plain Old JavaScript Object Visualization
=======

PojoViz is a tool to analyze the plain objects of a JavaScript object hierarchy by finding all the relationships found between the hierarchy entry point (in most libraries/frameworks a global variable) and the objects/functions linked to it.

Note: this webpage uses <a href="http://caniuse.com/shadowdom">Shadow DOM</a>, it's suggested that you use a browser that supports this technology for a complete experience.

## Why?

How many times did you find an awesome library/framework and wanted to see how it's structured just for fun?

## Features

- Renders the hierarchy of the browser's built in objects (Object, Function, etc)
- Renders the hierarchy of Node global objects (process, Buffer, etc)
- Renders a library/framework hosted anywhere through the Library Search widget (as long as there is a way to access it, e.g. for d3 `window.d3` would be the access point to the library)

## How does it work?

In short PojoViz receives as input a collection of JS objects and then:

- it does a Depth First Search through the properties of objects/functions it finds along the way
- it finishes whenever it reaches a max-depth or it completes visiting all reachable nodes
- it creates a graph whose layout is computed by [dagre](https://github.com/cpettitt/dagre)
- the graph is rendered by [d3.js](http://d3js.org/) or [three.js](http://threejs.org/)

## Development

See [development](http://mauriciopoppe.github.io/PojoViz/public/vulcanize.html#development)

## FAQ

### I want to see the structure of my library, how can I do it?

See [an interactive tutorial on how to visualize your stuff](http://mauriciopoppe.github.io/PojoViz/public/vulcanize.html#development)

### This project is not analyzing some stuff I have, why?

PojoViz doesn't analyze the AST of your code (which might be done by [Esprima](http://esprima.org/doc/index.html) btw),
 it's sort of an static analysis tool but it doesn't analyze your code, it just traverses JS objects

Let's say that you give PojoViz the following constructor `Point`

```javascript
// reachable
function Point(x, y) {
  // unreachable
  this.foo = function () {
  };

  // unreachable
  this.bar = {};
}

// reachable
Point.prototype.publicMethod = function () {
}
```

To make the method `foo` and the object `bar` reachable you'd need to
create an instance of `Point` e.g. `instance = new Point(1, 2)` PojoViz doesn't know about how to instantiate stuff,
 however if you feed PojoViz `Point` AND `instance` you're good to go :)

A huge description of this and other uses of PojoViz can be found in the [development section](http://mauriciopoppe.github.io/PojoViz/public/vulcanize.html#development)

### Can I use this stuff within the node environment

Sure you can, in fact the **Node Globals** section makes a query to a node server hosted on heroku and the analysis is done on runtime!
The output of PojoViz is an "stringifiable" collection which is rendered by pojoviz-renderer, you can even analyze
code of other programming languages with an adapter that outputs a similar collection and render it with pojoviz-renderer!

## TODO list

- [x] Render NodeJS global objects
- [x] Render NodeJS packages (done in [colony](http://hughsk.io/colony/))
- [x] Create a dev tutorial on how to visualize libraries
- [ ] Render scope variables analyzing the ast (see Esprima)
- [ ] Move to the selected object on edge click

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
- [t3](http://mauriciopoppe.github.io/t3/docs/)
