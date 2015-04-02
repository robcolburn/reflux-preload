describe('Server-side', function() {
  var React = require('react');
  var Router = require('react-router');
  var Preload = require('..');
  var WikiApp = require('./fixtures/WikiApp');
  /**
   * Example Render URL method.
   *
   * @param {ReactRoute} routes
   *   Component Tree of ReactRouter Route's.
   * @param {string} url
   *   Url to parse and render.
   * @return {Promise<string>}
   *   Yields string containing
   *     React rendered html including preload script tag.
   */
  function renderUrl (routes, url) {
    return new Promise(function(resolve) {
      Router.run(routes, url, function (Handler) {
        resolve(Preload.render(render, Handler));
      });
    });
  }
  /**
   * Example Render method
   * @param {...}
   *   Passes all args to React.createElement
   * @return {string}
   *   Markup returned from React. 
   */
  function render () {
    return React.renderToString(React.createElement.apply(React, arguments));
  }

  it('Renders the empty query.', function () {
    return renderUrl(WikiApp.routes, '/').then(function (result) {
      result.should.be.a('string');
      result.should.match(/<ul [^>]+><\/ul>/);
      result.should.match(/<script>refluxPreload=\{"WikiList"\:\{"query"\:\{\}\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    return renderUrl(WikiApp.routes, '/Pizza').then(function (result) {
      result.should.be.a('string');
      result.should.match(/<span [^>]+>Pizza<\/span>/);
      result.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    return Promise.all([
      renderUrl(WikiApp.routes, '/Pizza').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Pizza<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
      }),
      renderUrl(WikiApp.routes, '/Cats').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Cats<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Cats".+\}<\/script>/);
      }),
      renderUrl(WikiApp.routes, '/Dogs').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Dogs<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Dogs".+\}<\/script>/);
      })
    ]);
  });
});

