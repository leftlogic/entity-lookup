var http = require('http');
var st = require('st');
var mount = st({
  path: process.cwd(),
  index: 'index.html',
  url: '/'
});

http.createServer(function (req, res) {
  if (mount(req, res)) return // serving a static file
  myCustomLogic(req, res)
}).listen(process.env.PORT || 5000)
