var axios = require('axios');
var extend = require('lodash/object/extend');
var omit = require('lodash/object/omit');
var WikipediaAPI = {};

/**
 * Runs a query against Wikipedia.
 *
 * @param {object} action_parameters
 *   Key-value action paramters
 *   http://www.mediawiki.org/wiki/API:Main_page#Action-specific_parameters
 *
 * @return {Promise}
 *   Yields payload of pages, ex:
 *     -{object} query - Original query param.
 *     -{object} pages - Keyed by pageid, description of pages
 *        {"24768":{"pageid":24768,"ns":0,"title":"Pizza"}}
 */
WikipediaAPI.query = function (action_parameters) {
  return axios.get("https://en.wikipedia.org/w/api.php", {
    params: extend({
      "action": "query",
      "format": "json",
      "continue": ""
    }, action_parameters)
  }).then(function (payload) {
    // Payload looks like
    // {"batchcomplete":"","query":{"pages":{"24768":{"pageid":24768,"ns":0,"title":"Pizza"}}}}
    var pages = (payload.data.query && payload.data.query.pages) || {};
    pages = omit(pages, '-1');
    return {
      query: action_parameters,
      pages: pages
    };
  });
};

module.exports = WikipediaAPI;
