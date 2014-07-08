define(['ObjectAnalyzer', 'util/HashMap'], function (wrap, HashMap) {
  'use strict';
  var builtInObjects = [
    Object, Function,
    Array, Date, Boolean, Number, Math, String, RegExp, JSON,
    // window
  ],
    // a map of $$hashKey: value objects
    builtIn = wrap(new HashMap(), new HashMap()),
    win = wrap(new HashMap(), new HashMap()),
    user = wrap(new HashMap(), new HashMap()),
    all = wrap(new HashMap(), new HashMap()),
    // builtInMap = new HashMap(),
    // windowMap = new HashMap(),
    // objectMap = new HashMap(),
    // forbidMap = new HashMap(),
    // levels allowed
    prop = {
      levels: Infinity,
      dirty: true
    };

  // dfs
  builtIn.analyzeObjects(builtInObjects, 0);

  // win max level initially is 0
  win.preRender = function () {
    win.getObjects().empty();
    win.analyzeObjects([window], 0);
  };

  user.analyzeObjects([], 0);

  console.log(builtIn.getObjects());
  console.log(win.getObjects());
  console.log(user.getObjects());

  return {
    // objects
    builtIn: builtIn,
    win: win,
    user: user,
    all: all

    // api
  };
});