# Development Readme

## Installation

see browser-request


## The algorithm

%PojoViz works in three phases:

### Configuration phase

An object hierarchy is represented in %PojoViz with the following properties:

- Entry point to the hierarchy (e.g. window.d3, window.THREE, window.document.head)
- Hierarchy *src* (if the hierarchy is an external resource that needs to be fetched on runtime)
- *forbidden objects* which are discarded when found by the DFS algorithm
- The maximum number of *levels* allowed while running the DFS algorithm

### Process phase

The process phase is done in demand and it does the following:

- fetch any required external resource (if *src* was set)
- forbid any existing object (configured through *forbiddenTokens*) from being inspected
- perform the analysis of all the objects added to the inspector (recursively)
  - checks if the current object is forbidden to discard it
  - if not then all the properties of the objects are retrieved with `Object.getOwnPropertyNames`
  - when a property is evaluated, e.g. `obj.property`
    - if it's non-accessible the property is discarded (e.g. function.caller, function.arguments)
    - if it's non-traversable the property is discarded (object are traversable properties)
  - the process above is run again for all the remaining objects until a recursion limit is reached
  (configured with *levels*) or all the objects in the hierarchy have been analyzed

### Render phase

The process phase above will store all the traversable objects in a `HashMap`, in the render phase:

- The traversable objects are stringified, what this means is that a simple object is returned for each
traversable object, each object has properties describing the value of the object (i.e. if a given property
is traversable, if it's a primitive value, etc)
- The edges connecting the objects are also stringified, each edge is represented a simple object
telling the source node, destination node and the property to get there, (e.g. `sourceNode[property] = destinationNode` )
- The stringified representation of the hierarchy is passed to the layout program (run by [Dagre](https://github.com/cpettitt/dagre))
which augments the info above with cartesian coordinates `(x, y)`, `width`, `height`
- The chosen renderer (d3 or three.js) renders the hierarchy representation created above

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