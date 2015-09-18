describe('Server-side', function() {
  'use strict';
  var serverRoute = require('../example-app/WikiApp').serverRoute;
  var MockWikipediaAPI = require('../example-app/MockWikipediaAPI');

  it('Renders the empty query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/').then(function (html) {
      html.should.match(/<ul [^>]+><\/ul>/);
      getPayload(html).should.have.deep.property('resolved[0].value.query').that.eql({});
    });
  });
  it('Renders with some query.', function () {
    MockWikipediaAPI.mock();
    return serverRoute('/Pizza').then(function (html) {
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      getPayload(html).should.have.deep.property('resolved[0].value.query.titles', 'Pizza');
    });
  });
  it('Renders concurrent queries.', function () {
    MockWikipediaAPI.mock(3);
    return Promise.all([
      serverRoute('/Pizza').then(function (html) {
        html.should.match(/<span [^>]+>Pizza<\/span>/);
        getPayload(html).should.have.deep.property('resolved[0].value.query.titles', 'Pizza');
      }),
      serverRoute('/Cats').then(function (html) {
        html.should.match(/<span [^>]+>Cats<\/span>/);
        getPayload(html).should.have.deep.property('resolved[0].value.query.titles', 'Cats');
      }),
      serverRoute('/Dogs').then(function (html) {
        html.should.match(/<span [^>]+>Dogs<\/span>/);
        getPayload(html).should.have.deep.property('resolved[0].value.query.titles', 'Dogs');
      })
    ]);
  });
  it('Renders faiilure.', function () {
    MockWikipediaAPI.mock(1, 404);
    return serverRoute('/Pizza').then(function () {
      throw new Error("Bad request, should not resolve");
    }, function (result) {
      result.should.have.deep.property('errors[0].value.status', 404);
      var html = result.html;
      html.should.match(/<p [^>]+>404<\/p>/);
      getPayload(html).should.have.deep.property('rejected[0].value');
    });
  });
});

var rx = /<script>refluxPreload=([^<]+)<\/script>/i;
function getPayload(html) {
  return JSON.parse(html.match(rx)[1]);
}
