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
  this.displayName = options.displayName;
  this.renderEachTime = options.renderEachTime;
  this.levels = options.hasOwnProperty('levels') ? options.levels : 10;
  this.forbidden = options.forbidden || [];
  this.src = options.src;

  this.inspected = false;

  this.analyzer = analyzer();

  // parse forbid string to array
  this.parse();
}

GenericAnalyzer.prototype.init = function () {
  var me = this;
  return me.fetch()
    .then(function () {
      if (me.renderEachTime || !me.inspected) {
        me.inspect();
      }
      return me;
    });
};

GenericAnalyzer.prototype.parse = function () {
  if (typeof this.forbidden === 'string') {
    this.forbidden = this.forbidden.split(',');
  }
};

GenericAnalyzer.prototype.inspectSelf = function () {
  console.log('analyzing window.' + this.global);

  var me = this,
    analyzer = this.analyzer;
  // set a predefied global
  hashKey.createHashKeysFor(window[this.global], this.global);
  // update some properties of the analyzer
  analyzer.getObjects().empty();
  analyzer.setLevels(this.levels);
  
  this.forbidden.forEach(function(f) {
    me.analyzer.forbid(
      [f === 'window' ? window : window[f]], true
    );
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
    deferred = Q.defer(),
    script;

  function getValue() {
    return window[me.global];
  }

  if (this.src) {
    if (getValue()) {
      console.log('resource already fetched ' + this.src);
      deferred.resolve(getValue());
    } else {
      console.log('fetching script ' + this.src);
      console.time('fetch');
      script = document.createElement('script');
      script.src = this.src;
      script.onload = function () {
        console.timeEnd('fetch');
        deferred.resolve(getValue());
      };
      document.head.appendChild(script);
    }
  } else {
    deferred.resolve(getValue());
  }

  return deferred.promise;
};

GenericAnalyzer.prototype.showSearch = function (nodeName, nodeProperty) {
  var me = this;
  window.open(
    _.template('${searchEngine}${lucky}${libraryName} ${nodeName} ${nodeProperty}', {
      searchEngine: searchEngine,
      lucky: GenericAnalyzer.lucky ? '!ducky' : '',
      libraryName: me.displayName || me.global,
      nodeName: nodeName,
      nodeProperty: nodeProperty
    })
  );
};

module.exports = GenericAnalyzer;