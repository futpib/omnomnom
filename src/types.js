
const _ = require('lodash');

class Type {
	constructor(name) {
		this._name = name;
	}

	eq(other) {
		return other === this;
	}

	isSubtypeOf(other) {
		return this.eq(other);
	}

	isTypeOf() {
		return false;
	}

	new() {
		throw new Error('Not implemented');
	}

	toString() {
		return this._name;
	}
}

class TopType extends Type {
	constructor() {
		super('omnomnom.types.Top');
	}

	isTypeOf() {
		return true;
	}
}

const Top = new TopType();

const SubtypeMixin = superclass => class Subtype extends superclass {
	constructor(name, super_, ...rest) {
		super(name, ...rest);
		this._super = super_;
	}

	isSubtypeOf(other) {
		return this.eq(other) ||
			this._super.isSubtypeOf(other);
	}
}

const Subtype = SubtypeMixin(Type);

class RecordType extends Type {
	constructor(name, props) {
		super(name);
		this._props = props;
	}

	isTypeOf(value) {
		return _.every(this._props, (propType, propKey) => {
			return propType.isTypeOf(value[propKey]);
		});
	}

	new() {
		return _.mapValues(this._props, (propType, propKey) => {
			return propType.new();
		});
	}
}

class RecordSubtype extends SubtypeMixin(RecordType) {
	constructor(name, super_, extraProps) {
		super(name, super_, _.defaults({}, extraProps, super_._props));
	}
}

class SumType extends Type {
	constructor(...types) {
		super(`omnomnom.types.Sum(${types.join(', ')})`);
		this._types = types;
	}

	isSubtypeOf(other) {
		return _.some(this._types, t => t.isSubtypeOf(other));
	}

	isTypeOf(value) {
		return _.some(this._types, t => t.isTypeOf(value));
	}

	new() {
		return this._types[0].new();
	}
}

function Sum(...types) {
	if (types.length === 0) {
		throw new Error('`Sum()` is useless in parsers, I guess');
	}

	if (types.length === 1) {
		throw new Error('Use `T` instead of `Sum(T)`');
	}

	return new SumType(...types);
}

class ProductType extends Type {
	constructor(...types) {
		super(`omnomnom.types.Product(${types.join(', ')})`);
		this._types = types;
	}

	isSubtypeOf(other) {
		return _.every(this._types, t => t.isSubtypeOf(other));
	}

	isTypeOf(value) {
		return _.every(this._types, t => t.isTypeOf(value));
	}
}

function Product(...types) {
	if (types.length === 0) {
		throw new Error('Use `Null` instead of `Product()`');
	}

	if (types.length === 1) {
		throw new Error('Use `T` instead of `Product(T)`');
	}

	return new ProductType(...types);
}

class NullType extends ProductType {
	// TODO: is "null" in the name misleading? should this be named Unit?
	constructor() {
		super();
		this._name = 'omnomnom.types.Null';
	}

	isTypeOf(value) {
		// TODO: Does this even make sense considering Product([]) definition?
		return value === null;
	}

	new() {
		return null;
	}
}

const Null = new NullType();

class ArrayType extends Subtype {
	constructor(elementType) {
		super(`Array(${elementType.toString()})`, Top);
		this._elementType = elementType;
	}

	isTypeOf(value) {
		return _.isArray(value) &&
			_.every(value, v => this._elementType.isTypeOf(v));
	}

	new() {
		return [];
	}
}

function Array(elementType) {
	return new ArrayType(elementType);
}

class StringType extends Subtype {
	constructor(name, super_) {
		super(name || 'omnomnom.type.String', super_ || Top);
	}

	isTypeOf(value) {
		return 'string' === typeof value;
	}
}

const String = new StringType();

class StringValueType extends StringType {
	constructor(name, super_, value) {
		super(name || `omnomnom.type.StringValue(${value})`, super_ || String);
		this._value = value;
	}

	new() {
		return this._value;
	}

	isTypeOf(value) {
		return super.isTypeOf(value) &&
			value === this._value;
	}
}

function StringValue(v) {
	return new StringValueType(undefined, undefined, v);
}

class NumberType extends Subtype {
	constructor(name, super_) {
		super(name || 'omnomnom.type.Number', super_ || Top);
	}

	isTypeOf(value) {
		return 'number' === typeof value;
	}

	new() {
		return 0;
	}
}

const Number = new NumberType();

class IntegerType extends NumberType {
	constructor(name, super_) {
		super(name || 'omnomnom.type.Integer', super_ || Number);
	}

	isTypeOf(value) {
		return super.isTypeOf(value) &&
			Number.isSafeInteger(value);
	}
}

const Integer = new IntegerType();

class IntegerGTEType extends NumberType {
	constructor(name, super_, min) {
		super(name || `omnomnom.type.IntegerGTE(${min})`, super_ || Integer);
		this._min = min;
	}

	isTypeOf(value) {
		return super.isTypeOf(value) &&
			value >= this._min;
	}

	new() {
		return this._min;
	}
}

function IntegerGTE(min) {
	return new IntegerGTEType(undefined, undefined, min);
}

function type(name, super_, props) {
	if (!name) {
		throw new Error('Type name is required');
	}

	if (!super_) {
		throw new Error('Type parent is required');
	}

	props = props || {};

	props = _.mapValues(props, v => {
		if (v instanceof Type) {
			return v;
		}
		if ('string' === typeof v) {
			return StringValue(v);
		}
		throw new Error('yeah, no, not yet');
	});

	return new RecordSubtype(name, super_, props);
}

const Position = type('omnomnom.type.Position', Top, {
	line: IntegerGTE(1),
	column: IntegerGTE(0),
});

const SourceLocation = type('omnomnom.type.SourceLocation', Top, {
	source: Sum(Null, String),
	start: Position,
	end: Position
});

module.exports = {
	type,
	types: {
		Top,
		Sum,
		Product,
		Null,
		Array,
		String,
		Number,
		Integer,
		IntegerGTE,
		Position,
		SourceLocation
	}
};
