/*eslint no-console: 0*/
var express = require('express');
var app = express();
var webpackMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');
var WikiApp = require('./WikiApp');

// Route to Browser JS
app.use('/assets', webpackMiddleware(webpack({
  // configuration
  entry: __dirname + '/browser.js',
  output: {
    path: '/',
    filename: 'bundle.js'
  },
  target: 'web',
  debug: true,
  console: true,
  plugins: [
    new webpack.optimize.DedupePlugin()
  ]
}), {
  // options
  publicPath: '/',
  path: '/',
  filename: 'bundle.js',
  lazy: false,
  noInfo: true,
  quiet: true,
  stats: {
    colors: true
  }
}));

// Routes to React App
// Don't match URLs that look like filenames like favicon.ico
app.get(/^\/[0-9A-Za-z\-\_]*$/, reactRoute);

function reactRoute (req, res, next) {
  WikiApp.serverRoute(req.path)
    .then(function (html) {
      res.send(
        '<!doctype html><html>' +
        '<head><meta charset="utf-8"></head><body>' +
        html +
        '<script src="/assets/bundle.js"></script>' +
        '</body></html>'
      );
    })
    .catch(next);
}

// Print Error Messages
app.use(function (err, req, res) {
  console.error(err.stack);
  res.status((err && err.status) || 500).send({
    message: err.message,
    stack: err.stack
  });
});

module.exports = app;
