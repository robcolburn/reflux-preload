describe('Server-side', function() {
  var React = require('react');
  var Router = require('react-router');
  var serverRoute = require('../example-app/WikiApp').serverRoute;

  it('Renders the empty query.', function () {
    return serverRoute('/').then(function (result) {
      result.should.be.a('string');
      result.should.match(/<ul [^>]+><\/ul>/);
      result.should.match(/<script>refluxPreload=\{"WikiList"\:\{"query"\:\{\}\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    return serverRoute('/Pizza').then(function (result) {
      result.should.be.a('string');
      result.should.match(/<span [^>]+>Pizza<\/span>/);
      result.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    return Promise.all([
      serverRoute('/Pizza').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Pizza<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
      }),
      serverRoute('/Cats').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Cats<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Cats".+\}<\/script>/);
      }),
      serverRoute('/Dogs').then(function (result) {
        result.should.be.a('string');
        result.should.match(/<span [^>]+>Dogs<\/span>/);
        result.should.match(/<script>refluxPreload=\{"WikiList".+"Dogs".+\}<\/script>/);
      })
    ]);
  });
});

