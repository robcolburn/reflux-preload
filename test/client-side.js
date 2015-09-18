/*eslint-env browser, mocha*/
/*eslint no-console: 0*/
var phantom = require('phantom');
var MockWikipediaAPI = require('../example-app/MockWikipediaAPI');
describe('Client-side', function () {
  'use strict';
  var browser;
  var server = require('../example-app/server');
  var port = server.address().port;

  // Get browser and server up and running
  before(function (done) {
    phantom.create(function (ph) {
      browser = ph;
      done();
    });
  }, 2000);

  after(function () {
    server.close();
    browser.exit();
  });

  function clientRoute(path, browserFn) {
    MockWikipediaAPI.mock();
    return new Promise(function (resolve) {
      browser.createPage(function (page) {
        page.set('onConsoleMessage', function (msg) {
          console.log("Browser Console: " + msg)
        });
        page.open('http://localhost:' + port + path, function() {
          page.evaluate(browserFn || getHTML, function (result) {
            page.close();
            resolve(result);
          });
        });
      });
    });
  }

  function getHTML () {
    return document.body.innerHTML;
  }



  var rx = /<script>refluxPreload=([^<]+)<\/script>/i;
  function getPayload(html) {
    return JSON.parse(html.match(rx)[1]);
  }

  it('Renders the empty query', function () {
    return clientRoute('/').then(function (html) {
      html.should.match(/<ul [^>]+><\/ul>/);
      getPayload(html).should.have.deep
        .property('resolved[0].value.query').that.eql({});
    });
  });
  it('Renders with some query.', function () {
    return clientRoute('/Pizza').then(function (html) {
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      getPayload(html).should.have.deep
        .property('resolved[0].value.query.titles', 'Pizza');
    });
  });
  it('Renders concurrent queries.', function () {
    return Promise.all([
      clientRoute('/Pizza').then(function (html) {
        html.should.match(/<span [^>]+>Pizza<\/span>/);
        getPayload(html).should.have.deep
          .property('resolved[0].value.query.titles', 'Pizza');
      }),
      clientRoute('/Cats').then(function (html) {
        html.should.match(/<span [^>]+>Cats<\/span>/);
        getPayload(html).should.have.deep
          .property('resolved[0].value.query.titles', 'Cats');
      }),
      clientRoute('/Dogs').then(function (html) {
        html.should.match(/<span [^>]+>Dogs<\/span>/);
        getPayload(html).should.have.deep
          .property('resolved[0].value.query.titles', 'Dogs');
      })
    ]);
  });
  it('Runs React lifecycle.', function () {
    return clientRoute('/Pizza').then(function (html) {
      html.should.match(/<a[^>]+style="color:\s?green[^>]+>/);
    });
  });

});
