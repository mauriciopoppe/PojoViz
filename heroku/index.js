/**
 * Created by mauricio on 2/19/15.
 */
var app = require('koa')();
var router = require('koa-router');
//var pojoviz = require('pojoviz');
var pojoviz = require('../src/');
var Promise = require('promise');

var util = require('util');

function run(config) {
  return new Promise(function (resolve, reject) {
    pojoviz
      .setCurrentInspector(config)
      .then(function () {
        var str = pojoviz.getCurrentInspector().analyzer.stringify(true);
        return JSON.stringify(str);
      })
      .then(resolve, reject);
  });
}

app
  .use(router(app))
  .get('/', function *(next) {
    this.body = yield run({
      entryPoint: 'global',
      forbiddenTokens: ''
      //analyzerConfig: {
      //  levels: 0
      //}
    });
    yield next;
  });

app.listen(3001);