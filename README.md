PojoViz - Plain Old JavaScript Object Visualization
=======

PojoViz is a tool to visualize the plain objects of a JavaScript object hierarchy by finding all the relationships found between the hierarchy entry point (in most libraries/frameworks a global variable) and the objects/functions linked to it.

To start, click on any of the links on the left ⬅️.

## How does it work?

In short PojoViz receives as input a collection of JS objects and then:

- It does a Depth First Search through the properties of objects/functions it finds along the way
- It finishes whenever it reaches a max-depth or it completes visiting all reachable nodes
- It creates a graph whose layout is computed by [dagre](https://github.com/cpettitt/dagre)
- The graph is rendered by [d3.js](http://d3js.org/)

## Why?

I wanted a way to visualize the object structure of libraries, meaning, if you take the `Object` and follow `Object.prototype` how
many other objects will you find?

Learnings:

- `typeof Function.prototype` is `function`. I thought that all prototypes were of type `object`.
- There are some objects in `window` that are read-only and we can't set properties on them.
- There are many "array like" objects somewhere deep in the stack in `window`.

## Features

- Renders the hierarchy of the browser's built in objects (Object, Function, etc)
- Renders a library/framework hosted anywhere through the Library Search widget (as long as there is a way to access it, e.g. for d3 `window.d3` would be the access point to the library)

## Technologies used in this project

- [d3](http://d3js.org/)
- [Dagre](https://github.com/cpettitt/dagre)
