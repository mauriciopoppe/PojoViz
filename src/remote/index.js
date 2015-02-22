/**
 * Created by mauricio on 2/22/15.
 */
var pojoviz = global.pojoviz;
if (!pojoviz) {
  throw 'This is not a standalone project, pojoviz not found';
}

var request = require('request');
var url = 'http://rest.heroku.mauriciopoppe.com/pojoviz/node/global';
//var url = 'http://localhost:5000/pojoviz/node/global';
pojoviz.remote = {
  nodeGlobal: function (config) {
    request
      .post({ url: url, form: config }, function (err, response, body) {
        var fromJSON = JSON.parse(body);
        console.log(fromJSON);
        console.log(pojoviz.draw.doProcess(fromJSON));
      });
  }
};

module.exports = pojoviz.remote;