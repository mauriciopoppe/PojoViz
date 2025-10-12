const myLibraries = [
  {
    label: "PojoViz",
    entrypoint: "pojoviz",
    alwaysDirty: true,
    additionalForbiddenTokens:
      "global:pojoviz.InspectedInstances.pojoviz.analyzer.items",
  },
  {
    label: "t3",
    entrypoint: "t3",
  },
];

const hugeHierarchies = [
  {
    label: "ExtJS",
    entrypoint: "Ext",
    src: "//cdn.sencha.com/ext/gpl/4.2.1/ext-all.js",
    analyzerConfig: {
      levels: 1,
    },
  },
  {
    label: "Phaser",
    entrypoint: "Phaser",
    src: "//cdnjs.cloudflare.com/ajax/libs/phaser/2.0.6/phaser.min.js",
    analyzerConfig: {
      visitSimpleFunctions: true,
    },
  },
];

const nodeGlobals = [
  {
    label: "global",
    entryPoint: "global",
    forbiddenTokens: "pojoviz:builtIn",
    analyzerConfig: {
      levels: 3,
    },
  },
  {
    label: "process",
    entryPoint: "process",
    analyzerConfig: {
      levels: 5,
    },
  },
  {
    label: "console",
    entryPoint: "console",
  },
  {
    label: "Buffer",
    entryPoint: "Buffer",
  },
  {
    label: "Promise",
    entryPoint: "Promise",
  },
  {
    label: "Set",
    entryPoint: "Set",
  },
  {
    label: "WeakSet",
    entryPoint: "WeakSet",
  },
  {
    label: "Map",
    entryPoint: "Map",
  },
  {
    label: "WeakMap",
    entryPoint: "WeakMap",
  },
].map(function (v) {
  v.remote = true;
  return v;
});

export const schemas = {
  knownHierarchies: [
    { entrypoint: "object", label: "Object" },
    { entrypoint: "builtIn", label: "Built In" },
  ],
  notableLibraries: [
    { entrypoint: "jQuery", label: "jQuery" },
    { entrypoint: "Lo-Dash", label: "lodash" },
    { entrypoint: "d3", label: "d3" },
    { entrypoint: "THREE", label: "three.js" },
  ],
  myLibraries,
  hugeHierarchies,
  // nodeGlobals depended on my Heroku instance so it doesn't work anymore :(
  nodeGlobals,
};

