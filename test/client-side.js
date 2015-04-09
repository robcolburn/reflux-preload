describe('Client-side', function() {
  var React = require('react/addons');
  var TestUtils = React.addons.TestUtils;
  var Router = require('react-router');
  var clientRoute = require('../example-app/WikiApp').clientRoute;

  before(function() {
    global.document = require('jsdom').jsdom();
    global.window = global.document.defaultView;
  });
  after(function() {
    delete global.document;
    delete global.window;
  });

  it('Renders the basic route', function () {
    return clientRoute('/').then(function (element) {
      TestUtils.isElement(element).should.eql(true);
      var node = TestUtils.renderIntoDocument(element);
      var matches = TestUtils.scryRenderedDOMComponentsWithClass(node, 'wiki-list');
      matches[0].getDOMNode().should.be.a('object');
    });
  });
});
