
const test = require('ava');

const om = require('..');

const i = om.interfaces;

const Position = om.interfaces('Position', i.Top, {
	line: i.Number,
	column: i.Number
});

const SourceLocation = om.interfaces('SourceLocation', i.Top, {
	source: i.Sum(i.String, i.Null),
	start: Position,
	end: Position
});

const Node = om.interface('Node', i.Top, {
	type: i.String,
	loc: i.Sum(SourceLocation, i.Null)
})

const Expression = om.interface('Expression', Node, {});

const Identifier = om.interface('Identifier', Expression, {
	type: 'Identifier',
	name: i.String,
});

const Program = om.interface('Program', Node, {
	type: 'Program',
	body: i.Array(Statement)
});

const Statement = om.interface('Statement', Node, {});

const BlockStatement = om.interface('BlockStatement', Statement, {
	type: 'BlockStatement',
	body: i.Array(Statement)
});

const Function = om.interface('Function', Node, {
	id: i.Sum(Identifier, i.Null),
	params: i.Array(Identifier),
	body: BlockStatement
});

const ExpressionStatement = om.interface('ExpressionStatement', Statement, {
	type: 'ExpressionStatement',
	expression: Statement
});

const ReturnStatement = om.interface('ReturnStatement', Statement, {
	type: 'ReturnStatement',
	argument: i.Sum(Expression, i.Null)
});

const FunctionExpression = om.interface('FunctionExpression', i.Product(Function, Expression), {
	type: 'FunctionExpression'
});

const CallExpression = om.interface('CallExpression', Expression, {
	type: 'CallExpression',
	callee: Expression,
	arguments: i.Array(Expression)
});

const parseIdentifier = om.parser(
	Identifier,
	identifier => om.parsers.regexp(/\w[\w\d]+/).into(identifier.name)
);

const parseCallExpression = om.parser(
	CallExpression,
	callExpression => om.parsers.sequence([
		parseExpression.into(callExpression.callee),
		om.parsers.regexp(/\s*/),
		om.parsers.string('('),
		om.parsers.regexp(/\s*/),
		om.parsers.separatedList(
			parseExpression,
			om.parsers.sequence([
				om.parsers.regexp(/\s*/),
				om.parsers.string(','),
				om.parsers.regexp(/\s*/)
			])
		).into(callExpression.arguments),
		om.parsers.regexp(/\s*/),
		om.parsers.string(')'),
		om.parsers.regexp(/\s*/)
	])
);

const parseFunction = om.parser(
	Function,
	function_ => om.parsers.sequence([
		om.parsers.regexp(/\s*/),
		om.parsers.string('function'),
		om.parsers.regexp(/\s*/),
		om.parsers.string('('),
		om.parsers.separatedList(
			parseIdentifier,
			om.parsers.sequence([
				om.parsers.regexp(/\s*/),
				om.parsers.string(','),
				om.parsers.regexp(/\s*/)
			])
		).into(function_.params),
		om.parsers.string(')'),
		om.parsers.regexp(/\s*/),
		parseBlockStatement.into(function_.body),
		om.parsers.regexp(/\s*/),
	])
);

const parseFunctionExpression = om.parser(
	FunctionExpression,
	functionExpression => parseFunction.into(functionExpression)
);

const parseExpression = om.parser(
	Expression,
	expression => om.parsers.choice([
		parseIdentifier,
		parseCallExpression,
		parseFunctionExpression
	]).into(expression)
);

const parseExpressionStatement = om.parser(
	ExpressionStatement,
	expressionStatement => parseExpression.into(expressionStatement.expression)
);

const parseBlockStatement = om.parser(
	BlockStatement,
	blockStatement => om.parsers.sequence([
		om.parsers.zeroOrMore(om.parsers.regexp(/\s+/)),
		om.parsers.string('{'),
		om.parsers.zeroOrMore(parseStatement).into(blockStatement.body),
		om.parsers.string('}'),
		om.parsers.zeroOrMore(om.parsers.regexp(/\s+/))
	])
);

const parseReturnStatement = om.parser(
	ReturnStatement,
	returnStatement => om.parsers.sequence([
		om.parsers.zeroOrMore(om.parsers.regexp(/\s+/)),
		om.parsers.string('return'),
		om.parsers.oneOrMore(om.parsers.regexp(/\s+/)),
		om.parsers.zeroOrOne(parseExpression).into(returnStatement.argument)
	])
);

const parseStatement = om.parsers.choice([
	parseExpressionStatement,
	parseBlockStatement,
	parseReturnStatement
]);

const parseProgram = om.parser(
	Program,
	program => om.parsers.zeroOrMore(parseStatement).into(program.body)
);

test('empty program', t => {
	t.deepEqual(parseProgram(''), {
		type: 'Program',
		body: []
	});
});
