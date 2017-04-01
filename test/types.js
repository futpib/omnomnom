
const test = require('ava');

const {
	type,
	types: {
		Top,
		Sum,
		Product,
		Null,
		Array
	}
} = require('../src/types.js');

test.skip('subtype relation', t => {
	t.true(Top.isSubtypeOf(Top));
	t.true(type('Top2', Top).isSubtypeOf(Top));
	t.true(Sum(Top, Top).isSubtypeOf(Top));
	t.true(type('Top + Top', Sum(Top, Top)).isSubtypeOf(Top));
	t.true(Product(Top, Top).isSubtypeOf(Top));
	t.true(type('Top * Top', Product(Top, Top)).isSubtypeOf(Top));
	t.true(Null.isSubtypeOf(Top));
	t.true(type('Null2', Null).isSubtypeOf(Top));
	t.true(Array(Null).isSubtypeOf(Top));
	t.true(type('Array(Null)', Array(Null)).isSubtypeOf(Top));
});
