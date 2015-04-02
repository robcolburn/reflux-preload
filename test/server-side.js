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
   *   Resolves with string containing
   *     React rendered content to be embeded in HTML
   *     Preloaded JS to be embeded in script tag.
   */
  function renderPath (url) {
    return new Promise (function (resolve, reject) {
      Router.run(WikiApp.routes, url, function (Handler, state) {
        try {
          resolve(Preload.collect(function() {
            render(Handler);
          }));
        } catch (err) {
          reject(err);
        }
      });
    }).then(function(preloadPackage) {
      return new Promise (function (resolve, reject) {
        Router.run(WikiApp.routes, url, function (Handler, state) {
          try {
            Preload.deliver(preloadPackage);
            resolve(
              render(Handler) +
              Preload.toPayload(preloadPackage)
            );
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  function render () {
    return React.renderToString(React.createElement.apply(React, arguments));
  }

  it('Renders the empty query.', function () {
    return renderPath('/').then(function (result) {
      result.should.be.a('string');
      result.should.match(/<ul [^>]+><\/ul>/);
      result.should.match(/<script>refluxPreload=\{"WikiList"\:\{"query"\:\{\}\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    return renderPath('/Pizza').then(function (result) {
      result.should.be.a('string');
      result.should.match(/<span [^>]+>Pizza<\/span>/);
      result.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    return Promise.all([
      renderPath('/Pizza').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Pizza<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
      }),
      renderPath('/Cats').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Cats<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Cats".+\}<\/script>/);
      })
    ]);
  });
});

