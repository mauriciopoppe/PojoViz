var connect = require('connect');
var serveStatic = require('serve-static');
var app = connect();
app.use(serveStatic('public'));
app.listen(process.env.PORT || 3000);