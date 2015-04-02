
var PromiseCollector = require('promise-collector');
// Easy flag to distinquish state.
var isServer = typeof window === 'undefined';

var Preload = new PromiseCollector();
// Name for stashing to the client.
Preload.payloadName = 'refluxPreload';
/**
 * Applies promised data to Store prior to render.
 * Your Component should define the following methods:
 *   <Promise> preload
 *     When called, returns a promise representing
 *   <boolean> isLoaded
 *     If it returns TRUE, then the View already has it's required data,
 *     and skip calling preload when changing to this View.
 *
 * @param {string} name
 *   Identifier for this Preload action.
 * @param {Reflux.Action} action
 *   The action to be preloaded.
 * @return {Mixin}
 *   Mixin for a React Component.
 */
Preload.connect = function(name, action) {
  Preload.receive(name, action.trigger.bind(action));
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
