var PromiseCollector = require('promise-collector');
// Easy flag to distinquish state.
var isServer = typeof window === 'undefined';

var Preload = new PromiseCollector();
// Name for stashing to the client.
Preload.payloadName = 'refluxPreload';
/**
 * Pipes a component's load action to Preload.
 *
 * Component should define the following hooks:
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
 * @param {object} hooks
 *   Optional, key-values to override hooks.
 *   Values can be functions, or names of methods on the component.
 * @return {Mixin}
 *   Mixin for a React Component.
 */
Preload.connect = function(name, action, hooks) {
  var preload = 'preload';
  var isLoaded = 'isLoaded';
  if (hooks) {
    preload = hooks.preload;
    isLoaded = hooks.isLoaded;
  }
  Preload.receiveAction(name, action);
  return {
    componentWillMount: function () {
      var _preload = typeof preload === "string" ? this[preload] : preload;
      var _isLoaded = typeof isLoaded === "string" ? this[isLoaded] : isLoaded;
      // If we have a preload method. Listen and start it.
      if (_preload) {
        // Server: Listen to preload's data, and kick off loading.
        if (isServer) {
          Preload.promise(name, _preload);
        }
        // Client: If Component would like, kick off loading on Component's behalf.
        else if (!_isLoaded || !_isLoaded()) {
          _preload();
        }
      }
    }
  };
};
/**
 * Give PromiseCollector a function to call, when it has data to deliver.
 *
 * @param {string} name
 *   Identifier for this loading action.
 * @param {Reflux.Action} action
 *   The async Action to trigger with loaded or rejected data.
 */
Preload.receiveAction = function(name, action) {
  if (action.completed) {
    Preload.receive(name,
      action.completed.trigger.bind(action.completed),
      action.failed.trigger.bind(action.failed));
  }
  else {
    Preload.receive(name, action.trigger.bind(action));
  }
};
/**
 * Trigger an get a Sync Action's promise. 
 *
 * @param {Reflux.Action} syncAction
 *   The Sync Action to trigger.
 * @return {promise}
 *   Resolves with the emitted value.
 */
Preload.triggerPromise = function (syncAction) {
  var promise = new Promise(function(resolve) {
    var clear = syncAction.listen(function () {
      var actionArgs = Array.prototype.slice.call(arguments, 0);
      resolve.apply(this, actionArgs);
      clear();
    });
  });
  syncAction.apply(syncAction, Array.prototype.slice.call(arguments, 1));
  return promise;
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
 * @return {string}
 *   Encoded payload to deliver to client (with inline script).
 */
Preload.toPayload = function (collection) {
  return '<script>' + this.payloadName + '=' + JSON.stringify(collection) + '</script>';
};
/**
 * Get payload on client side.
 *
 * @return {object}
 *   The payload.
 */
Preload.getPayload = function () {
  /*global window*/
  return window[this.payloadName];
};

module.exports = Preload;
