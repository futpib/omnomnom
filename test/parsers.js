
const test = require('ava');

const {
	parser,
	parsers: {
		choice,
		sequence,
		string,
		regexp,
		zeroOrMore,
		oneOrMore,
		separatedList
	}
} = require('../src/parsers');

test('string', t => {
	string('asdf')
})
