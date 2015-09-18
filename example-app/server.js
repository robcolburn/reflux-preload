#!/usr/bin/env node
/*eslint no-console: 0*/
var port = process.env.PORT || 3000;
module.exports = require('./middleware').listen(port);
console.log('Example Server Started');
console.log('----------------------');
console.log('http://localhost:' + port);
