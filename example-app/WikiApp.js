var React = require('react');
var Reflux = require('reflux');
var Router = require('react-router');
var isEqual = require('lodash/lang/isEqual');
var map = require('lodash/collection/map');
var Preload = require('..');
var WikipediaAPI = require('./WikipediaAPI');

// General Reflux Action template - Wikipedia use-case
var GetWikiActions = {};
GetWikiActions.load = Reflux.createAction({asyncResult: true});
GetWikiActions.load.listenAndPromise(WikipediaAPI.query);

var WikiStore = Reflux.createStore({
  listenables: [GetWikiActions],
  data: {},
  onLoadCompleted: function(data){
    this.trigger(this.data = data);
  },
  onLoadFailed: function(error){
    this.trigger(this.data = {error: error.status + (error.statusText || '')});
  },
  getInitialState: function() {
    return this.data;
  }
});
exports.WikiStore = WikiStore;

var UIActions = {};
UIActions.textColor = Reflux.createAction({sync: true});
var UIStore = Reflux.createStore({
  listenables: [UIActions],
  state: {},
  onTextColor: function(textColor){
    this.state.textColor = textColor;
    this.trigger(this.state);
  },
  getInitialState: function() {
    return this.state;
  }
});
exports.UIStore = UIStore;

var WikiList = React.createClass({
  mixins: [
    Reflux.connect(WikiStore, 'wiki')
    ,Reflux.connect(UIStore, 'ui')
    ,Preload.connect('WikiList', GetWikiActions.load)
    ,Preload.connect('WikiUI', UIActions.textColor, {
      preload: function() {
        return Preload.triggerPromise(UIActions.textColor, 'blue');
      }
    })
  ],
  contextTypes: {
    router: React.PropTypes.func
  },
  preload: function(){
    return GetWikiActions.load(this.context.router.getCurrentParams());
  },
  isLoaded: function() {
    return isEqual(this.state.wiki.query, this.context.router.getCurrentParams());
  },
  componentDidMount: function() {
    // Apply a state, so we can verify this occurs in testing.
    this.setState({textColor: 'green'});
  },
  render: function () {
    var D = React.DOM;
    var pages = this.state.wiki && this.state.wiki.pages;
    return D.div({}, [
      D.h1({key: 'title',
        style: {color: this.state.ui.textColor}},
        'Wikipedia App'),
      this.isLoaded()
        ? D.ul({key: 'list', className: 'wiki-list'},
          pages && map(pages, function (page, id) {
            return D.li({key: id}, D.a({
              href: 'https://en.wikipedia.org/wiki/' + page.title,
              style: {color: this.state.textColor || this.state.ui.textColor || ''}
            }, [
              page.pageid, ':', page.title
            ]));
          }, this)
        )
        : D.p({key: 'description'}, this.state.wiki.error || 'Loading...')
    ]);
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
  /*global document*/
  Preload.deliver(Preload.getPayload());
  return new Promise(function (resolve) {
    Router.run(routes, Router.HistoryLocation, function (Handler) {
      resolve(React.render(
        React.createElement(Handler, null),
        document.getElementById('app')
      ));
    });
  });
}
exports.clientRoute = clientRoute;
