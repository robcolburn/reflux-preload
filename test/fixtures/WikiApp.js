var React = require('react');
var Reflux = require('reflux');
var Router = require('react-router');
var axios = require('axios');
var _ = require('lodash');
var Preload = require('../..');

// General Reflux Action template - Wikipedia use-case
var GetWiki = {};
GetWiki.load = Reflux.createAction({asyncResult: true});
GetWiki.load.listenAndPromise(function(query) {
  return axios.get("http://en.wikipedia.org/w/api.php", {
    params: _.extend({
      "action": "query",
      "format": "json",
      "continue": ""
    }, query)
  }).then(function (payload) {
    // {"batchcomplete":"","query":{"pages":{"24768":{"pageid":24768,"ns":0,"title":"Pizza"}}}}
    return {
      query: query,
      pages: payload.data.query && payload.data.query.pages
    };
  });
});
exports.GetWiki = GetWiki;

var WikiStore = Reflux.createStore({
  listenables: [GetWiki],
  data: {},
  onLoadCompleted: function(data){
    try {
      this.trigger(this.data = data);
    } catch (err) {
      this.onLoadFailed(err);
    }
  },
  onLoadFailed: function(err){
    console.error(err);
    this.trigger(this.data = {});
  },
  getInitialState: function() {
    return this.data;
  }
});
exports.WikiStore = WikiStore;

var WikiList = React.createClass({
  mixins: [
    Reflux.connect(WikiStore, 'wiki'),
    Preload.connect('WikiList', GetWiki.load.completed),
  ],
  contextTypes: {
    router: React.PropTypes.func
  },
  getParams: function() {
    return this.context.router.getCurrentParams();
  },
  preload: function(){
    return GetWiki.load(this.context.router.getCurrentParams());
  },
  isLoaded: function() {
    return _.isEqual(this.state.wiki.query, this.context.router.getCurrentParams());
  },
  render: function () {
    var D = React.DOM;
    var pages = this.state.wiki && this.state.wiki.pages;
    return D.ul({className: 'wiki-list'},
      pages && _.map(pages, function (page, id) {
         return D.li({key: id}, D.a(
           {href: 'http://en.wikipedia.org/wiki/' + page.title},
           [page.pageid, ':', page.title]
         ));
      })
    );
  }
});
exports.WikiList = WikiList;

var routes = Route({path:"/", handler: WikiList},
  Route({path:"/:titles", handler: WikiList})
);
function Route (params, children) {
  return React.createElement(Router.Route, params, children);
}
exports.routes = routes;
