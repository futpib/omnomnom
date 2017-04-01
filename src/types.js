
const _ = require('lodash');

class Type {
	constructor(name, props) {
		this._name = name;
		this._props = props;
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

	toString() {
		return this._name;
	}
}

class TopType extends Type {
	constructor() {
		super('omnomnom.types.Top', null, {});
	}

	isTypeOf() {
		return true;
	}
}

const Top = new TopType();

class Subtype extends Type {
	constructor(name, super_, extraProps) {
		super(name, _.defaults({}, extraProps, super_.props));
		this._super = super_;
	}

	isSubtypeOf(other) {
		return this.eq(other) ||
			this._super.isSubtypeOf(other);
	}
}

class SumType extends Type {
	constructor(...types) {
		super(types.join(' + '), {TODO: true}); // TODO
		this._types = types;
	}

	isTypeOf(value) {
		return _.some(this._types, t => t.isTypeOf(value));
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
		super(types.join(' * '), {TODO: true});
		this._types = types;
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
		super([]);
		this._name = 'omnomnom.types.Null';
	}

	isTypeOf(value) {
		// TODO: Does this even make sense considering Product([]) definition?
		return value === null;
	}
}

const Null = new NullType();

class ArrayType extends Type {
	constructor(elementType) {
		super(`Array(${elementType.toString()})`, Top, {});
		this._elementType = elementType;
	}

	isTypeOf(value) {
		return _.isArray(value) &&
			_.every(value, v => this._elementType.isTypeOf(v));
	}
}

function Array(elementType) {
	return new ArrayType(elementType);
}

function type(name, super_, props) {
	if (!name) {
		throw new Error('Type name is required');
	}

	if (!super_) {
		throw new Error('Type parent is required');
	}

	props = props || {};

	return new Subtype(name, super_, props);
}

module.exports = {
	type,
	types: {
		Top,
		Sum,
		Product,
		Null,
		Array
	}
};
