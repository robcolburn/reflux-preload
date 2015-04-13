"use strict";

require("es6-promise").polyfill();
var chai = require("chai");
global.expect = chai.expect;
chai.config.includeStack = true;
chai.should();
chai.use(require("chai-as-promised"));
