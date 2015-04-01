describe('Server-side', function() {
  var React = require('react');
  var Router = require('react-router');
  var Preload = require('..');
  var WikiApp = require('./fixtures/WikiApp');
  /**
   * Example Express Render Middleware
   * @param {string} url
   *   Url to parse and render.
   * @return {Promise}
   *   Resolves with object containing
   *     {string} content - React rendered content to be embeded in HTML
   *     {string} payload - Preloaded JS to be embeded in script tag.
   */
  function renderPath (url) {
    return new Promise (function (resolve, reject) {
      Router.run(WikiApp.routes, url, function (Handler, state) {
        Preload.collect(function() {
          try {
            render(Handler);
          } catch (err) {
            reject(err);
          }
        }).then(function(preloadPackage) {
          try {
            Router.run(WikiApp.routes, url, function (Handler, state) {
              try {
                Preload.deliver(preloadPackage);
                resolve({
                  content: render(Handler),
                  payload: Preload.toPayload(preloadPackage)
                });
              } catch (err) {
                reject(err);
              }
            });
          } catch (err) {
            reject(err);
          }
        }, reject);
      });
    });
  }

  function render () {
    return React.renderToString(React.createElement.apply(React, arguments));
  }

  it('Renders the basic route.', function () {
    return renderPath('/').then(function (result) {
      result.should.have.all.keys(['content', 'payload']);
      result.content.match('<ul').should.have.length(1);
      result.payload.match('payload={"WikiList"').should.have.length(1);
    });
  });
  it('Renders with some query.', function () {
    return renderPath('/Pizza').then(function (result) {
      result.should.have.all.keys(['content', 'payload']);
      result.content.match('<ul').should.have.length(1);
      result.payload.match('payload={"WikiList"').should.have.length(1);
    });
  });
});

