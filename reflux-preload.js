var PromiseCollector = require('promise-collector');
// Easy flag to distinquish state.
var isServer = typeof window === 'undefined';

var Preload = new PromiseCollector();
// Name for stashing to the client.
Preload.payloadName = 'refluxPreload';
/**
 * Pipes a component's load action to Preload.
 *
 * Component should define the following methods:
 *   <Promise> preload
 *     When called, returns a promise representing
 *   <boolean> isLoaded
 *     If it returns TRUE, then the View already has it's required data,
 *     and skip calling preload when changing to this View.
 *
 * @param {string} name
 *   Identifier for this loading action.
 * @param {Reflux.Action} action
 *   The async Action to trigger with loaded or rejected data.
 * @return {Mixin}
 *   Mixin for a React Component.
 */
Preload.connect = function(name, action) {
  if (action.completed) {
    Preload.receive(name,
      action.completed.trigger.bind(action.completed),
      action.failed.trigger.bind(action.failed));
  }
  else {
    Preload.receive(name, action.trigger.bind(action));
  }
  return {
    componentWillMount: function () {
      Preload.promise(name, this.preload);
      // Client-only - Kick off loading on View's behalf if it would like.
      if (!isServer && (this.isLoaded === undefined || !this.isLoaded())) {
        this.preload();
      }
    }
  };
};
/**
 * Wrap a render function in preload detection and delivery.
 *
 * @param {function} render
 *   A callback to render markup.
 * @param {...}
 *   Params to be passed to render callback
 * @return {Promise}
 *   Yields string of html from rendering function w/ paylaod attached.
 *   Rejects with object:
 *   -{object} errors: Errors from rejection
 *   -{string} html: String of html from rendering function w/ paylaod attached.
 */
Preload.render = function (render) {
  var args = Array.prototype.slice.call(arguments, 1);
  function postRender (preloadPackage) {
    Preload.deliver(preloadPackage);
    return render.apply(this, args) +
      Preload.toPayload(preloadPackage);
  }
  return Preload.collect(function() {
    render.apply(this, args);
  })
  .then(postRender, function (preloadPackage) {
    throw {
      html: postRender(preloadPackage),
      errors: preloadPackage.rejected
    };
  });
};
/**
 * Convert object to pass on to client.
 *
 * @param {object} collection
 *   Generic Object to store on client
 * @param {string} payloadName
 *   Optional. Sets the name of payload to store on client.
 * @return {string}
 *   Encoded payload to deliver to client (with inline script).
 */
Preload.toPayload = function (collection, payloadName) {
  return '<script>' + this.payloadName + '=' + JSON.stringify(collection) + '</script>';
};
/**
 * Get payload on client side.
 *
 * @param {string} payloadName
 *   Optional. Sets the name of payload to retreive on client.
 * @return {object}
 *   The payload.
 */
Preload.getPayload = function (payloadName) {
  /*global window*/
  return window[this.payloadName];
};

module.exports = Preload;
