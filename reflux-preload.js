
var PromiseCollector = require('promise-collector');
// Easy flag to distinquish state.
var isServer = typeof window === 'undefined';

var Preload = new PromiseCollector();
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

module.exports = Preload;
