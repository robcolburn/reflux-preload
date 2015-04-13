/*global require:true, describe:true, before:true, it:true, window:true, setTimeout:true*/
describe('Client-side', function () {
  'use strict';
  var app = require('../example-app/server');
  var phantom = require('phantom');
  var browser;
  var server;

  // Get browser and server up and running
  before(function (done) {
    server = app.listen(process.env.PORT || 3000);
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
    return new Promise(function (resolve, reject) {
      browser.createPage(function (page) {
        page.open('http://localhost:3000' + path,
          page.evaluate.bind(page, browserFn || getHTML, resolve)
        );
      });
    });
  }

  function getHTML () {
    return document.body.innerHTML;
  }

  it('Renders the empty query', function () {
    return clientRoute('/').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<ul [^>]+><\/ul>/);
      html.should.match(/<script>refluxPreload=\{"WikiList"\:\{"query"\:\{\}\}\}<\/script>/);
    });
  });
  it('Renders with some query.', function () {
    return clientRoute('/Pizza').then(function (html) {
      html.should.be.a('string');
      html.should.match(/<span [^>]+>Pizza<\/span>/);
      html.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
    });
  });
  it('Renders concurrent queries.', function () {
    return Promise.all([
      clientRoute('/Pizza').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Pizza<\/span>/);
        html.should.match(/<script>refluxPreload=\{"WikiList".+"Pizza".+\}<\/script>/);
      }),
      clientRoute('/Cats').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Cats<\/span>/);
        html.should.match(/<script>refluxPreload=\{"WikiList".+"Cats".+\}<\/script>/);
      }),
      clientRoute('/Dogs').then(function (html) {
        html.should.be.a('string');
        html.should.match(/<span [^>]+>Dogs<\/span>/);
        html.should.match(/<script>refluxPreload=\{"WikiList".+"Dogs".+\}<\/script>/);
      })
    ]);
  });
});
