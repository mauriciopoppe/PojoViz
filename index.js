var connect = require('connect'),
    directory = 'public/';

connect()
    .use(connect.static(directory))
    .listen(80);