var nock = require('nock');

var MockWikipediaAPI = {};
MockWikipediaAPI.on = function() {
  nock.enableNetConnect();
};
MockWikipediaAPI.off = function() {
  nock.disableNetConnect();
};
/**
 *
 * @param {int} count
 *   Number of requests to intercept (default 1).
 * @param {number} status
 *   HTTP Status Code to respond with (default 200)
 * @return {nock.scope}
 *  A `nock` scope object.
 */
MockWikipediaAPI.mock = function (count, status) {
  count = count || 1;
  status = status || 200;
  var scope = this;
  if (!scope || !scope.isDone) {
    scope = nock('https://en.wikipedia.org');
  }
  for (var i = 0; i < count; i++) {
    scope = scope
      .filteringPath(/\?.*/g, '')
      .get('/w/api.php')
      .delayConnection(30)
      .reply(status, success);
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
