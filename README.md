# reflux-preload

A way to manage preloading on the server within a [`reflux`](https://www.npmjs.com/package/reflux) based application.

[![npm package](https://img.shields.io/npm/v/reflux-preload.svg?style=flat-square)](https://www.npmjs.org/package/reflux-preload)
[![build status](https://img.shields.io/travis/robcolburn/reflux-preload/master.svg?style=flat-square)](https://travis-ci.org/robcolburn/reflux-preload)
[![dependency status](https://img.shields.io/david/robcolburn/reflux-preload.svg?style=flat-square)](https://david-dm.org/robcolburn/reflux-preload)

An architecture based on [`react-router`](https://npmjs.com/package/react-router) and [`reflux`](https://npmjs.com/package/reflux) has a [chicken or egg dilemma](http://en.wikipedia.org/wiki/Chicken_or_the_egg) problem.  Where you need data to render your page on the server, but you don't know what data to load until you've rendered.

 The problem is, Router yields a basic, static schematic of your app that is largely incomplete because child components are unknown till `render`, and because you're likely rendering "sorry, no content" rather than proper children when your components don't have data.  Your data load itself isn't triggered to load though until Reflux Actions are fired, and those are likely fired until at least `componentWillMount`.

 So, how do we resolve this? How about rendering again?  You just need a promise that all your data is ready this time around.  Enter "Reflux Preload", our idea is capture these data promises during the initial `render`, and then await those promises before `render`ing again.  Along the way, we solve for:

 * Concurrent requests, that is we need to keep sets of promises separated from each other)
 * Passing data to client, so client-side React can pick-up where server-side left off.

## Overview of Reflux Preload phases

1. Render blank-slate on the server
  - During render: initiate loading reources, collect promises and recepient listeners.
  - We do not have usable data yet, provided later.

2. Render with data on the server
  - Deliver the resources to registered listeners.
  - Render while skipping the load of additional resources.
  - Yield up a string for another layer to delier to client.

3. Initial page load on the browser
  - Deliver the resources to registered listeners.
  - Render while skipping the load of additional resources.

4. Secondary page load on the browser
  - Perform the load action as normal flow of loading component.

## Integration


0. Assumptions

 * You're using [`react-router`](https://www.npmjs.com/package/react-router) in addition to [`reflux`](https://www.npmjs.com/package/reflux).
 * You have a means of converting your data requests to Promises - we're using [`axios`](https://www.npmjs.com/package/axios).
 * You're accustomed to Reflux's async Actions using the `listenAndPromise` method.

 ```js
 var GetWiki = {};
 GetWiki.load = Reflux.createAction({asyncResult: true});
 GetWiki.load.listenAndPromise(function(titles) {
   return axios.get("http://en.wikipedia.org/w/api.php", {
     "titles": titles,
     "action": "query",
     "format": "json",
     "continue": ""
   });
 });
 ```

1. Components

  In your component, you'll add a `Preload.connect` which binds an async Actions to a key in the Preload object.  This key should be unique to your needs, typically we just use the Action name.

  ```jsx
  var WikiList = React.createClass({
    mixins: [
      Router.State,
      Reflux.connect(WikiStore, 'wiki'),
      Preload.connect('GetWiki', GetWiki.load),
    ],
    contextTypes: {
      router: React.PropTypes.func
    },
    preload: function () {
      return GetPages.load(this.context.router.getCurrentParams());
    },
    isLoaded: function () {
      return this.state.wiki.query === this.getParams().query;
    },
    render: function () {
      return <ul>
        {_.mapValues(this.state.wiki.pages, page =>
           <li><a href={'http://en.wikipedia.org/wiki/' + page.title}>
             {page.pageid} : {page.title}
           </a></li>
        )}
      </ul>
    }
  });
  ```

2. Server-side Renderer

  Render the markup, while collecting promises.  The module handles the double calls to render for you, you'll just need to wrap your normal.

  * Callback Style
  ```js
  function render (routes, url, callback) {
    Router.run(routes, url, function (Handler) {
      Preload.render(function myRenderMethod () {
        return React.renderToString(React.createElement(Handler));
      })
      .then(callback.bind(this, null), callack);
    });
  }
  ```

  * Promise-Style
  ```js
  var prerender = Preload.render.bind(Preload, function render () {
    return '<div id="app">' +
      React.renderToString(React.createElement.apply(React, arguments)) +
      '</div>';
  });
  function render (routes, url) {
    return Promise(Router.run.bind(Router, routes, url))
      .then(prerender);
  });
  ```

3. Client-side Renderer

  Be sure to deliver the payload before running React.

  ```js
  Preload.deliver();
  Router.run(routes, Router.HistoryLocation, function (Handler) {
    React.render(
      React.createElement(Handler),
      document.getElementById('app')
    );
  });
  ```
