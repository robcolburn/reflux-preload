describe('Server-side', function() {
  'use strict';
  var React = require('react');
  var Router = require('react-router');
  var serverRoute = require('../example-app/WikiApp').serverRoute;
  var MockWikipediaAPI = require('../example-app/MockWikipediaAPI');

  it('Renders the empty query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<ul [^>]+><\/ul>/);
      html.should.match(/<script>refluxPreload=\{"WikiList":\{"query":\{\},"pages":\{\}\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/Pizza').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      html.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    MockWikipediaAPI.mock(3);
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

