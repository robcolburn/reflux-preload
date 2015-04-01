# reflux-preload
A way to manage preloading on the server within a [`reflux`](https://www.npmjs.com/package/reflux) based application.

## Overview of Reflux Preload phases

1. Render blank-slate on the server, we want to:
  - Start collecting promises, and fire a React Reload.
  - Initiate loading required resources, collecting promises along the way.
  - We do not have usable data for Views yet, provided later.

2. Render again on the server, we want to:
  - Deliver the results to corresponding Views.
  - Skip loading any data, we already have data from Phase 1.

3. Initial page load on the browser, we want to:
  - Deliver the results to corresponding Views.
  - Skip loading data, we already have data from Phase 1.

4. Regular page on the browser, we want to:
  - Perform the load, as normal flow of loading component.

## Integration


1. Components

Well assume:
* You're using [`react-router`](https://www.npmjs.com/package/react-router) in addition to [`reflux`](https://www.npmjs.com/package/reflux).
* You have a means of converting your data requests to Promises - we're using [`axios`](https://www.npmjs.com/package/axios).

You'll need some async Action, with an associated `listenAndPromise` method.

```js
var GetWikiPages = Reflux.createAction({asyncResult: true});
GetWikiPages.listenAndPromise(function(titles) {
  return axios.get("http://en.wikipedia.org/w/api.php", {
    "titles": titles,
    "action": "query",
    "format": "json",
    "continue": ""
  });
});
```

Now in your component, you'll add a `Preload.connect` which binds the completed action to a key (this key should be unique to your needs, probably the Component's name).

```js
var WikiList = React.createClass({
  mixins: [
    Router.State,
    Reflux.connect(WikiStore, 'wiki'),
    Preload.connect('Pizza', GetWiki.completed),
  ],
  preload: function(){
    return GetPages(this.getParams().query);
  },
  isLoaded: function() {
    return this.state.wiki.query === this.getParams().query;
  },
  render: function () {
    var D = React.DOM;
    return D.ul({},
      _.mapValues(this.props.pages, function (page) {
         return D.li(null, D.a(
           {href: 'http://en.wikipedia.org/wiki/' + page.title},
           [page.pageid, ':', page.title]
         ));
      })
    );
  }
});

```

2. Server-side Renderer

Render the initial virtual dom, collecting promises along the way.  After promise is done, deliver to re-establish context, and re-render.


```js
Router.run(routes, url, function (Handler, state) {
  Preload.collect(function() {
    render(Handler);
  }).then(function(preloadPackage) {
    Router.run(routes, url, function (Handler, state) {
      Preload.deliver(preloadPackage);
      app.render('index.ejs', {
        content: render(Handler),
        payload: Preload.toPayload(preloadPackage)
      }, …);
    });
  });
});
function render () {
  return React.renderToString(React.createElement.apply(React, arguments));
}
```

index.ejs
```ejs
<!DOCTYPE html>
<html>
  <body>
      <div id="app"><%- content %></div>
      <script><%- payload %></script>
      <script src="app.js"></script>
  </body>
</html>

```

3. Client-side Renderer

Be sure to deliver the payload before running React.

```js
Preload.deliver(Preload.getPayload());
Router.run(routes, Router.HistoryLocation, function(Handler, state) {
  React.render(
    React.createElement(Handler, null),
    document.getElementById('app')
  );
});
```
