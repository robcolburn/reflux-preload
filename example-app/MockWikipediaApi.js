var nock = require('nock');

MockWikipediaAPI = {};
MockWikipediaAPI.on = function() {
  nock.enableNetConnect();
};
MockWikipediaAPI.off = function() {
  nock.disableNetConnect();
};
MockWikipediaAPI.mock = function (count) {
  count = count || 1;
  var scope = this;
  if (!scope || !scope.isDone) {
    scope = nock('http://en.wikipedia.org');
  }
  for (var i = 0; i < count; i++) {
    scope = scope
      .filteringPath(/\?.*/g, '')
      .get('/w/api.php')
      .delayConnection(30)
      .reply(200, success);
  }
  return scope;
};

function success (uri) {
  var result = {batchcomplete: ""};
  var titles = uri.match(/titles=([^&]+)/);
  if (titles) {
    result.query = {
      pages: titles[1]
        .split('|')
        .reduce(function (pages, title) {
          var pageid = Math.floor(Math.random() * 1e5);
          pages[pageid] = {pageid: pageid, ns: 0, title: title};
          return pages;
        }, {})
    };
  }
  return result;
}

module.exports = MockWikipediaAPI;
