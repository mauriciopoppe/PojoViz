'use strict';

var Q = require('q'),
  _ = require('lodash'),
  utils = require('../util/'),
  hashKey = require('../util/hashKey'),
  analyzer = require('../ObjectAnalyzer');

var searchEngine = 'https://duckduckgo.com/?q=';

function GenericAnalyzer(options) {
  options = options || {};
  // if (!name) {
  //   throw 'name needs to be defined';
  // }
  this.global = options.global;
  this.displayname = options.displayname;
  this.levels = options.hasOwnProperty('levels') ? options.levels : 10;
  this.forbidden = options.forbidden || [];
  this.src = options.src;
  this._hasfc = options.hasOwnProperty('functionconstructors');
  this.functionconstructors = this._hasfc ?
    options.functionconstructors : GenericAnalyzer.SHOW_FUNCTION_CONSTRUCTORS;
  this.rendereachtime = options.hasOwnProperty('rendereachtime') ?
    options.rendereachtime : false;
  this.allfunctions = options.hasOwnProperty('allfunctions') ?
    options.allfunctions : false;

  this.inspected = false;

  // parse forbid string to array
  this.parse();

  this.analyzer = analyzer({
    functionConstructors: this.functionconstructors,
    allFunctions: this.allfunctions
  });
}

GenericAnalyzer.SHOW_BUILTIN = false;
GenericAnalyzer.SHOW_FUNCTION_CONSTRUCTORS = true;
GenericAnalyzer.FORBIDDEN = 'pojoviz:window,pojoviz:builtIn,document';

GenericAnalyzer.prototype.init = function () {
  var me = this;
  console.log('%cPojoViz', 'font-size: 15px; color: ');
  return me.fetch()
    .then(function () {
      if (me.rendereachtime || !me.inspected) {
        me.inspect();
      }
      return me;
    });
};

GenericAnalyzer.prototype.parse = function () {
  if (typeof this.forbidden === 'string') {
    this.forbidden = this.forbidden.split(',');
  }
  if (typeof this.functionconstructors === 'string') {
    this.functionconstructors = this.functionconstructors === 'true';
  }
  if (typeof this.rendereachtime === 'string') {
    this.rendereachtime = this.rendereachtime === 'true';
  }
  if (typeof this.allfunctions === 'string') {
    this.allfunctions = this.allfunctions === 'true';
  }
};

GenericAnalyzer.prototype.markDirty = function () {
  this.inspected = false;
};

GenericAnalyzer.prototype.inspectSelf = function () {
  console.log('analyzing window.' + this.global);
  var me = this,
    analyzer = this.analyzer,
    forbidden = [].concat(this.forbidden);
  // set a predefied global
  hashKey.createHashKeysFor(window[this.global], this.global);
  // clean
  analyzer.getObjects().empty();
  analyzer.forbidden.empty();
  analyzer.setLevels(this.levels);

  // settings > show links to built in objects
  if (!GenericAnalyzer.SHOW_BUILTIN) {
    forbidden = forbidden.concat(
      GenericAnalyzer.FORBIDDEN.split(',')
    );
  }

  forbidden.forEach(function(f) {
    var arr,
      tokens;
    if (!f.indexOf('pojoviz:')) {
      tokens = f.split(':');
      arr = require('../ObjectHashes')[tokens[1]].getObjects();
    } else {
      arr = [window[f]];
    }
    console.log('forbidding: ', arr);
    analyzer.forbid(arr, true);
  });

  analyzer.add([window[this.global]]);

};

GenericAnalyzer.prototype.markInspected = function () {
  // mark this container as inspected
  this.inspected = true;
  return this;
};

GenericAnalyzer.prototype.inspect = function () {
  this
    .markInspected()
    .inspectSelf();
};

GenericAnalyzer.prototype.preRender = function () {
};

GenericAnalyzer.prototype.fetch = function () {
  var me = this,
    script;

  function getValue() {
    return window[me.global];
  }

  function promisify(v) {
    return function () {
      utils.notification('fetching script ' + v, true);
      var deferred = Q.defer();
      script = document.createElement('script');
      script.src = v;
      script.onload = function () {
        utils.notification('completed script ' + v, true);
        deferred.resolve(getValue());
      };
      document.head.appendChild(script);
      return deferred.promise;
    };
  }

  if (this.src) {
    if (getValue()) {
      console.log('resource already fetched ' + this.src);
    } else {
      var srcs = this.src.split('|');
      return srcs.reduce(function (prev, current) {
        return prev.then(promisify(current));
      }, Q('reduce'));
    }
  }

  return Q(true);
};

GenericAnalyzer.prototype.showSearch = function (nodeName, nodeProperty) {
  var me = this;
  window.open(
    _.template('${searchEngine}${lucky}${libraryName} ${nodeName} ${nodeProperty}', {
      searchEngine: searchEngine,
      lucky: GenericAnalyzer.lucky ? '!ducky' : '',
      libraryName: me.displayname || me.global,
      nodeName: nodeName,
      nodeProperty: nodeProperty
    })
  );
};

module.exports = GenericAnalyzer;