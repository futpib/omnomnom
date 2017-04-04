
const _ = require('lodash');

class Parser {
	parse(string) {
		throw new Error('Not implemeted');
	}

	into(propSetter) {
		return new ParserInto(this, propSetter);
	}
}

class ParserInto extends Parser {
	constructor(parser, propSetter) {
		this._parser = parser;
		this._propSetter = propSetter;
	}

	parse(...args) {
		const value = this._parser.parse(...args);
		this._propSetter.set(value);
		return value;
	}
}

class TypeParser extends Parser {
	constructor(type, parserFactory) {
		super();
		this._type = type;
		this._parserFactory = parserFactory;
	}

	parse(...args) {
		const instanceBuilder = this._type.builder();
		const parser = this._parserFactory(instanceBuilder);
		parser.parse(...args)
		const instance = instanceBuilder.build();
		return instance;
	}
}

function parser(type, parserFactory) {
	return new TypeParser(type, parserFactory);
}

class ChoiceParser extends Parser {
	constructor(parsers) {
		this._parsers = parsers;
	}

	parse(...args) {
		const {errors, successes} = _.reduce(this._parsers, (parser, result) => {
			// TODO?: stop after first success
			try {
				const success = parser(...args);
				result.successes.push(success);
			} catch (error) {
				result.errors.push(error);
			}
			return result;
		}, {
			errors: [],
			successes: []
		});

		if (successes.length === 0) {
			// TODO: join errors in case every parser fails
			throw errors[0];
		}

		return successes[0];
	}
}

function choice(parsers) {
	if (parsers.length === 0) {
		throw new Error('Choice between zero parsers is not defined');
	}

	if (parsers.length === 1) {
		// TODO?: return the parser itself
		throw new Error('Use the parser itself instead of choice netween one parser');
	}

	return new ChoiceParser(parsers);
}

module.exports = {
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
};
