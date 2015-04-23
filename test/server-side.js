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
      html.should.match(/<script>refluxPreload=\{"resolved":\{"WikiList":\{"query":\{\},"pages":\{\}\}\},"rejected":\{\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/Pizza').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      html.should.match(/<script>refluxPreload=\{"resolved":\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    MockWikipediaAPI.mock(3);
    return Promise.all([
      serverRoute('/Pizza').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Pizza<\/span>/);
        html.should.match(/<script>refluxPreload=\{"resolved":\{"WikiList".+"Pizza".+\}<\/script>/);
      }),
      serverRoute('/Cats').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Cats<\/span>/);
        html.should.match(/<script>refluxPreload=\{"resolved":\{"WikiList".+"Cats".+\}<\/script>/);
      }),
      serverRoute('/Dogs').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Dogs<\/span>/);
        html.should.match(/<script>refluxPreload=\{"resolved":\{"WikiList".+"Dogs".+\}<\/script>/);
      })
    ]);
  });
  it('Renders faiilure.', function () {
    MockWikipediaAPI.mock(1, 404);
    return serverRoute('/Pizza').then(function () {
      throw new Error("Bad requet, should not resolve");
    }, function (result) {
      result.should.have.deep.property('errors.WikiList.status', 404);
      var html = result.html;
      html.should.be.a('string');
      html.should.match(/<ul [^>]+><\/ul>/);
      html.should.match(/<script>refluxPreload=\{.+"rejected":\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
});

