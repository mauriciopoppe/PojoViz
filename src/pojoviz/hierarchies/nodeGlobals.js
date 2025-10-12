/**
 * Created by mauricio on 2/17/15.
 */
export default [
  {
    //  displayName: 'node/x',
    //  entryPoint: 'x'
    //}, {
    label: "global",
    entryPoint: "global",
    displayName: "node/global",
    forbiddenTokens: "pojoviz:builtIn",
    analyzerConfig: {
      levels: 3,
    },
  },
  {
    label: "process",
    entryPoint: "process",
    displayName: "node/process",
    analyzerConfig: {
      levels: 5,
    },
  },
  {
    label: "console",
    entryPoint: "console",
    displayName: "node/console",
  },
  {
    label: "Buffer",
    entryPoint: "Buffer",
    displayName: "node/Buffer",
  },
  {
    label: "Promise",
    entryPoint: "Promise",
    displayName: "node/Promise",
  },
  {
    label: "Set",
    entryPoint: "Set",
    displayName: "node/Set",
  },
  {
    label: "WeakSet",
    entryPoint: "WeakSet",
    displayName: "node/WeakSet",
  },
  {
    label: "Map",
    entryPoint: "Map",
    displayName: "node/Map",
  },
  {
    label: "WeakMap",
    entryPoint: "WeakMap",
    displayName: "node/WeakMap",
  },
].map(function (v) {
  v.remote = true;
  return v;
});

