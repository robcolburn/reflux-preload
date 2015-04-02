describe('Client-side', function() {
  var React = require('react/addons');
  var TestUtils = React.addons.TestUtils;
  var Router = require('react-router');
  var Preload = require('..');
  var WikiApp = require('./fixtures/WikiApp');
  before(function() {
    global.document = require('jsdom').jsdom();
    global.window = global.document.defaultView;
  });
  after(function() {
    delete global.document;
    delete global.window;
  });

  /**
   * Example Express Render Middleware
   * @param {string} url
   *   Url to parse and render.
   * @return {Promise}
   *   Resolves with React element.
   */
  function renderPath (url) {
    return new Promise(function (resolve, reject) {
      Preload.deliver(Preload.getPayload());
      Router.run(WikiApp.routes, url, function(Handler, state) {
        resolve(React.createElement(Handler, null));
      });
    });
  }

  it('Renders the basic route', function () {
    return renderPath('/').then(function (element) {
      TestUtils.isElement(element).should.be.true;
      var node = TestUtils.renderIntoDocument(element);
      var matches = TestUtils.scryRenderedDOMComponentsWithClass(node, 'wiki-list');
      matches[0].getDOMNode().should.exist;
    });
  });
});
