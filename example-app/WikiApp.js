var React = require('react');
var Reflux = require('reflux');
var Router = require('react-router');
var isEqual = require('lodash/lang/isEqual');
var map = require('lodash/collection/map');
var Preload = require('..');
var WikipediaAPI = require('./WikipediaAPI');

// General Reflux Action template - Wikipedia use-case
var GetWiki = {};
GetWiki.load = Reflux.createAction({asyncResult: true});
GetWiki.load.listenAndPromise(WikipediaAPI.query);
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
    return isEqual(this.state.wiki.query, this.context.router.getCurrentParams());
  },
  componentDidMount: function() {
    // Apply a state, so we can verify this occurs in testing.
    this.setState({mounted: true});
  },
  render: function () {
    var D = React.DOM;
    var pages = this.state.wiki && this.state.wiki.pages;
    return D.ul({className: 'wiki-list'},
      pages && map(pages, function (page, id) {
         return D.li({key: id}, D.a(
           {href: 'http://en.wikipedia.org/wiki/' + page.title,
           style: this.state.mounted && {color:'green'}},
           [page.pageid, ':', page.title]
         ));
      }, this)
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

/**
 * Example Server Render method
 * @param {...}
 *   Passes all args to React.createElement
 * @return {string}
 *   Markup returned from React. 
 */
var prerender = Preload.render.bind(Preload, function render () {
  return '<div id="app">' +
    React.renderToString(React.createElement.apply(React, arguments)) +
    '</div>';
});

/**
 * Example Render URL method.
 *
 * @param {ReactRoute} routes
 *   Component Tree of ReactRouter Route's.
 * @param {string} url
 *   Url to parse and render.
 * @return {Promise<string>}
 *   Yields string containing
 *     React rendered html including preload script tag.
 */
function serverRoute (url) {
  return new Promise(Router.run.bind(Router, routes, url))
    .then(prerender);
}
exports.serverRoute = serverRoute;

/**
 * Example Client-side rendering
 * @return {Promise<ReactElement>}
 *   Yields ReactElement of rendered virutal DOM.
 */
function clientRoute () {
  Preload.deliver(Preload.getPayload());
  return new Promise(function (resolve) {
    Router.run(routes, Router.HistoryLocation, function(Handler) {
      React.render(
        React.createElement(Handler, null),
        document.getElementById('app')
      );
    });
  });
}
exports.clientRoute = clientRoute;
