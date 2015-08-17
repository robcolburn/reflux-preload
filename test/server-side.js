/*eslint-env mocha*/
describe('Server-side', function() {
  'use strict';
  var serverRoute = require('../example-app/WikiApp').serverRoute;
  var MockWikipediaAPI = require('../example-app/MockWikipediaAPI');

  it('Renders the empty query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/').then(function (html) {
      html.should.match(/<ul [^>]+><\/ul>/);
      JSON.parse(html.match(/<script>refluxPreload=(.+)<\/script>/i)[1])
        .should.have.deep.property('resolved.WikiList.query').that.eql({});
    });
  });
  it('Renders with some query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/Pizza').then(function (html) {
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      JSON.parse(html.match(/<script>refluxPreload=(.+)<\/script>/i)[1])
        .should.have.deep.property('resolved.WikiList.query.titles', 'Pizza');
    });
  });
  it('Renders concurrent queries.', function () {
    MockWikipediaAPI.mock(3);
    return Promise.all([
      serverRoute('/Pizza').then(function (html) {
        html.should.match(/<span [^>]+>Pizza<\/span>/);
        JSON.parse(html.match(/<script>refluxPreload=(.+)<\/script>/i)[1])
          .should.have.deep.property('resolved.WikiList.query.titles', 'Pizza');
      }),
      serverRoute('/Cats').then(function (html) {
        html.should.match(/<span [^>]+>Cats<\/span>/);
        JSON.parse(html.match(/<script>refluxPreload=(.+)<\/script>/i)[1])
          .should.have.deep.property('resolved.WikiList.query.titles', 'Cats');
      }),
      serverRoute('/Dogs').then(function (html) {
        html.should.match(/<span [^>]+>Dogs<\/span>/);
        JSON.parse(html.match(/<script>refluxPreload=(.+)<\/script>/i)[1])
          .should.have.deep.property('resolved.WikiList.query.titles', 'Dogs');
      })
    ]);
  });
  it('Renders faiilure.', function () {
    MockWikipediaAPI.mock(1, 404);
    return serverRoute('/Pizza').then(function () {
      throw new Error("Bad request, should not resolve");
    }, function (result) {
      result.should.have.deep.property('errors.WikiList.status', 404);
      var html = result.html;
      html.should.match(/<ul [^>]+><\/ul>/);
      JSON.parse(html.match(/<script>refluxPreload=(.+)<\/script>/i)[1])
        .should.have.deep.property('rejected.WikiList');
    });
  });
});

