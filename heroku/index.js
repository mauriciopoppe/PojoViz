/**
 * Created by mauricio on 2/19/15.
 */
var app = require('koa')();
var router = require('koa-router');
//var pojoviz = require('pojoviz');
var pojoviz = require('../src/');
var Promise = require('promise');

function run(config) {
  return new Promise(function (resolve, reject) {
    pojoviz
      .run(config)
      .then(function (inspector) {
        var str = inspector.analyzer.stringify(true);
        return JSON.stringify(str);
      })
      .then(resolve, reject);
  });
}

app
  .use(router(app))
  .post('/global', function *(next) {
    try {
      this.body = yield run(this.params);
    } catch (e) {
      this.throw(400, e.stack);
    }
    yield next;
  });

app.listen(3001);