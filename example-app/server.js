#!/usr/bin/env node
module.exports = require('./middleware')
  .listen(process.env.PORT || 3000);
