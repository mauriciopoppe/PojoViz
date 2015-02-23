/**
 * Created by mauricio on 2/22/15.
 */
var pojoviz = global.pojoviz;
if (!pojoviz) {
  throw 'This is not a standalone project, pojoviz not found';
}

var xhr = require('xhr');
var url = 'http://rest.heroku.mauriciopoppe.com/pojoviz/node/global';
//var url = 'http://localhost:5000/pojoviz/node/global';
pojoviz.remote = {
  nodeGlobal: function (config) {
    xhr({
      json: config,
      uri: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function (err, response, body) {
        pojoviz.draw.render({
          remote: true,
          preRender: function () {},
          stringified: body
        });
      });
  }
};

module.exports = pojoviz.remote;