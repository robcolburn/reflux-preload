describe('Server-side', function() {
  'use strict';
  var React = require('react');
  var Router = require('react-router');
  var serverRoute = require('../example-app/WikiApp').serverRoute;

  it('Renders the empty query.', function () {
    return serverRoute('/').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<ul [^>]+><\/ul>/);
      html.should.match(/<script>refluxPreload=\{"WikiList"\:\{"query"\:\{\}\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    return serverRoute('/Pizza').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      html.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    return Promise.all([
      serverRoute('/Pizza').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Pizza<\/span>/);
        html.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
      }),
      serverRoute('/Cats').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Cats<\/span>/);
        html.should.match(/<script>refluxPreload=\{"WikiList".+"Cats".+\}<\/script>/);
      }),
      serverRoute('/Dogs').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Dogs<\/span>/);
        html.should.match(/<script>refluxPreload=\{"WikiList".+"Dogs".+\}<\/script>/);
      })
    ]);
  });
});

