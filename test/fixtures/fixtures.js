"use strict";

require("es6-promise").polyfill();
var chai = require("chai");
global.expect = chai.expect;
chai.should();
chai.use(require("chai-as-promised"));
