describe('Client-side', function() {
  var React = require('react/addons');
  var TestUtils = React.addons.TestUtils;
  var Router = require('react-router');
  var Preload = require('..');
  var WikiApp = require('./fixtures/WikiApp');
  beforeEach(function() {
    global.document = require('jsdom').jsdom();
    global.window = global.document.defaultView;
  });
  afterEach(function() {
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
      // TODO: Get TestUtils working to actually test.
      // var node = TestUtils.renderIntoDocument(element);
      // var matches = TestUtils.scryRenderedDOMComponentsWithTag(node, 'ul');
      // TestUtils.isElement(element).should.be.true;
//       TestUtils.isElementOfType(element, WikiList).should.be.true;
//       matches[0].getDOMNode().should.exist;
    });
  });
});
