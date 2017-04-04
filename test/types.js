
const test = require('ava');

const {
	type,
	types: {
		Top,
		Sum,
		Product,
		Null,
		Array,
		Position,
		SourceLocation
	}
} = require('../src/types.js');

test('subtype relation', t => {
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

	t.true(Position.isSubtypeOf(Top));
	t.true(type('Position2', Position).isSubtypeOf(Top));

	t.true(SourceLocation.isSubtypeOf(Top));
	t.true(type('SourceLocation', SourceLocation).isSubtypeOf(Top));
});

test('default value constructor', t => {
	t.deepEqual(type('Test', Top, {
		type: 'Kek',
		loc: SourceLocation,
		nulls: Array(Null)
	}).new(), {
		type: 'Kek',
		loc: {
			source: null,
			start: {
				line: 1,
				column: 0
			},
			end: {
				line: 1,
				column: 0
			}
		},
		nulls: []
	})
});
