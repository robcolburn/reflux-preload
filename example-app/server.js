var express = require('express');
var app = express();
var WikiApp = require('./WikiApp');
var lastRoute;

app.use(express.static(__dirname + '/public'));

// Routes to React App
app.get('/', reactRoute);
app.get('/:query', reactRoute);

function reactRoute (req, res, next) {
  WikiApp.serverRoute(req.path)
    .then(function (html) {
      res.send(
        '<!doctype html><html>' +
        '<head><meta charset="utf-8"></head><body>' +
        html +
        '</body></html>'
      );
    })
    .catch(next);
}

// Print Error Messages
app.use(function (err, req, res, next) {
  res.status((err && err.status) || 500).send({
    message: err.message,
    err: err
  });
});

module.exports = app;