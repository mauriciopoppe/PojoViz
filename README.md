PojoViz - Plain Old JavaScript Object Visualization
=======

%PojoViz is a tool to analyze the plain objects of a JavaScript library/framework by finding all the relationships found among the library entry point (typically a global variable) and the objects/functions linked to it.

Note: this webpage uses <a href="http://caniuse.com/shadowdom">Shadow DOM</a>, it's suggested that you use a browser that supports this technology for a complete experience.

## Why?

How many times did you find an awesome library/framework and wanted to see how it's structured just for fun?

## Features

- Export the generated graph to a simple JSON file consisting of nodes/edges
- Two renderers: SVG (d3) and WebGL (threejs)

<img class="center" src="http://f.cl.ly/items/1h1Y1b1y3z363T1d0U3z/pojovizthree.mov.gif" alt="">

- Analyze your preferred library/framework hosted anywhere, additional support to search libraries hosted on [http://cdnjs.com](http://cdnjs.com)

<img class="center" src="http://f.cl.ly/items/0s2I0u2t2y1x2N3o0n2P/pojoviz-search.mov.gif" alt="">

## The algorithm

%PojoViz works in three phases:

### Configuration phase

- The library's representation in %PojoViz is configured with the following properties:

	- Global access point to the library (e.g. window.d3 or window.THREE)
	- The maximum number of levels allowed while running the DFS algorithm
	- The *src* of the script (if it's an external resource)
	- The *forbidden objects* which are discarded when found by the DFS algorithm

### Process phase

- After the configuration is read %PojoViz's `ObjectAnalyzer` class analyzes the properties the global library/framework object, if any of these properties is an object/function constructor (configurable in settings) then `ObjectAnalyzer` will follow this link
- The previous step is done recursively saving each object/function found in a `HashMap` until the maximum number of levels has been reached discarding the *fobidden objects* in the process, these are the nodes of the graph
- `ObjectAnalyzer` will also in the process save the links found (from an object property to an object/function constructor), these are the edges of the graph
- The main program then asks `ObjectAnalyzer` for a JSON representation of the nodes/edges of the generated graph
- [Dagre](https://github.com/cpettitt/dagre)'s layout program is executed with the generated JSON which returns the positions of each node in a 2D plane

### Render phase

- The chosen renderer (d3 or three.js) renders the graph provided by the process phase

### Development notes

- %PojoViz's `hashKey` class adds an additional property to any object analyzed which is `__pojoVizKey__`, the property is not writtable nor enumerable and has the form:

```javascript
[typeof [object]]-[object name]

examples:

  the Object contructor
  - function-Object

  Object.prototype
  - object-Object-prototype

  for a simple object whose name can't be determined
  - object-1

```

- %PojoViz's `hashKey` determines the name of a function/object with the following algorithm:

  - If the function has a `name` property and it starts with an uppercase letter then this property is the name of the object (this only works for functions)
  - Make an analysis of the hidden `[[Classname]]` property of the object by calling `{}.toString.call(object)` if it gives the constructor name then this is the name of the object/function, e.g. `[object Date]`
  - If the object analyzed has a `name` at this point then it's `prototype` object (if there's one) is analyzed and given the name `name-prototype`

  ```javascript
    e.g. analyzing the Object function
    Object's name = Object
      +--> when Object.prototype is analyzed it gets
           the name Object.prototype
  ```

  - If the object doesn't have a name at this point then it's `constructor` property is analyzed only if it's a function performing the steps above, hopefully doing it this way the constructor gets a name and it's prototype too

  ```javascript
    e.g. analyzing the Function.prototype object
    Function.prototype doesn't have a name :(
      +--> Check Function.prototype.constructor
        +--> Function constructor has a name :)
        +--> Function.prototype now gets the name of its constructor
             appending -prototype
  ```

  - If the object doesn't have a name at this point then a unique name is generated using `_.uniqueId()` thus the name is always an increasing unqiue number

- Some properties are not considered even if they are linkeable, these are: `calle`, `caller`, `arguments`
- There are some hidden properties that are visible after executing `Object.getOwnPropertyNames`, the properties that match the following regex are not considered:

  - `/^__.*?__$/` e.g. `__data__`
  - `/^\$\$.*?\$\$$/` e.g. `$$hashKey$$`
  - `/[:+~!><=//\[\]@\. ]/` e.g. `+, @q, +=, -=`, this is done because we can't set a css class to an element with those characters ([Allowed characters](http://stackoverflow.com/questions/448981/what-characters-are-valid-in-css-class-selectors))

- To boost the performance of the analysis step two objects are used to cache some properties for the nodes/edges
- The current bottleneck of all the process is sadly the layout program

## Hello Pojoviz

Let's say we want to analyze the structure of the mother of all objects, the  `Object` function, in the following example each link analyzed is marked with `-->`:

```javascript
Object
 + length (number)
 ... many properties here
 + keys (function)
 +--> prototype (object, the Object's prototype)
 +--> [[Prototype]] (the hidden link to its prototype, which is
 					Function.prototype since Object is a function)

	Object.prototype
	 + toString (function, not a function constructor so it's not saved)
	 + constructor (function constructor but it's already saved)
	 ... many properties here

	Function.prototype (following the hidden [[Prototype]] link of the Object function)
	 + bind (function)
	 + toString (fucntion)
	 ... many properties here
	 +--> constructor (function, the object Function)
	 + [[Prototype]] (points to Object.prototype but it's already saved)

	 	Function
	 	+ length (number)
	 	... many properties here
 		+ prototype (points to Function.prototype which is already saved)
 		+ [[Prototype]] (points to Function.prototype too)
```

As seen, it's guaranteed that if no object is forbidden from the graph a minimum of 4 nodes will be saved.

The expected hashMap contents for the previous example:
```javascript
{
	'function-Object': Object,
	'object-Object-prototype': Object.prototype,
	'function-Function': Function,
	'function-Function-prototype': Function.prototype
}
```

The previous test is verified in the file `ObjectAnalyzer.spec.js`:
```javascript
// wrap is an instance of ObjectAnalyzer
it('should store the objects correctly', function () {
  wrap.add([Object]);
  expect(wrap.objects['function-Object']).to.equal(Object);
  expect(wrap.objects['object-Object-prototype']).to.equal(Object.prototype);
  expect(wrap.objects['function-Function']).to.equal(Function);
  expect(wrap.objects['function-Function-prototype']).to.equal(Function.prototype);
});
```

<a class="as-button" href="javascript:pushState('render:object')">Show me the Object example</a>

## Installation

With bower:

```javascript
bower install pojoviz
```

Usage:
```html
<!-- dagre, Q and lodash -->
<script src="bower_components/pojoviz/build/pojoviz-vendor.js"></script>
<script src="bower_components/pojoviz/build/pojoviz.js"></script>

<!-- include this script if you want the d3 and three.js renderers too -->
<!-- required dependencies: THREE, sole/tween.js, d3, t3 -->
<script src="bower_components/pojoviz-renderers.js"></script>
```

## API

<a class="as-button" href="javascript:pushState('render:pojoviz')">Show me the API</a>

### new pojoviz.ObjectAnalyzer()
Creates an instance of the analyzer class

#### instance.setLevels(levels)
Sets the maximum number of levels to analyze to be `levels`

#### instance.forbid([objects])
Forbids each element of the array `objects` from being analyzed

#### instance.add([objects])
Analyzes each element of the array `objects`

#### instance.stringify()
Stringifies the internal representation of the graph, this line should be called after `add` is called, it returns a JSON representation of the graph like this one:

```javascript
{
  "nodes": {
    "function-Object": [{
      "property": "length",
      "type": "number",
      "linkeable": false,
      "label": "function-Object"
    }, {
      "property": "name",
      "type": "string",
      "linkeable": false,
      "label": "function-Object"
    }, ...],
    "object-Object-prototype": [{
      "property": "constructor",
      "type": "function",
      "linkeable": true,
      "label": "object-Object-prototype"
    }, {
      "property": "toString",
      "type": "function",
      "linkeable": true,
      "label": "object-Object-prototype"
    }, ...],
    "function-Function-prototype": [{
      "property": "length",
      "type": "number",
      "linkeable": false,
      "label": "function-Function-prototype"
    }, {
      "property": "name",
      "type": "string",
      "linkeable": false,
      "label": "function-Function-prototype"
    }, ...],
    "function-Function": [{
      "property": "prototype",
      "type": "function",
      "linkeable": true,
      "label": "function-Function"
    }, {
      "property": "[[Prototype]]",
      "type": "object",
      "linkeable": true,
      "hidden": true,
      "label": "function-Function"
    }, ...]
  },
  "edges": {
    "function-Object": [{
      "from": "function-Object",
      "to": "object-Object-prototype",
      "property": "prototype"
    }, {
      "from": "function-Object",
      "to": "function-Function-prototype",
      "property": "[[Prototype]]"
    }],
    "object-Object-prototype": [{
      "from": "object-Object-prototype",
      "to": "function-Object",
      "property": "constructor"
    }],
    "function-Function-prototype": [{
      "from": "function-Function-prototype",
      "to": "function-Function",
      "property": "constructor"
    }, {
      "from": "function-Function-prototype",
      "to": "object-Object-prototype",
      "property": "[[Prototype]]"
    }],
    "function-Function": [{
      "from": "function-Function",
      "to": "function-Function-prototype",
      "property": "prototype"
    }, {
      "from": "function-Function",
      "to": "function-Function-prototype",
      "property": "[[Prototype]]"
    }]
  }
}
```

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

- Move to the selected object on dot click
- Undo/redo

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