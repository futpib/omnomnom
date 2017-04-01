
const _ = require('lodash');

const types = require('./src/types');
const parsers = require('./src/parsers');

module.exports = _.defaults({}, types, parsers);
