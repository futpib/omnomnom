
const test = require('ava');

const om = require('..');

const t = om.types;

const Position = om.type('Position', t.Top, {
	line: t.Number,
	column: t.Number
});

const SourceLocation = om.type('SourceLocation', t.Top, {
	source: t.Sum(t.String, t.Null),
	start: Position,
	end: Position
});

const Node = om.type('Node', t.Top, {
	type: t.String,
	loc: t.Sum(SourceLocation, t.Null)
})

const Expression = om.type('Expression', Node, {});

const Identifier = om.type('Identifier', Expression, {
	type: 'Identifier',
	name: t.String,
});

const Statement = om.type('Statement', Node, {});

const Program = om.type('Program', Node, {
	type: 'Program',
	body: t.Array(Statement)
});

const BlockStatement = om.type('BlockStatement', Statement, {
	type: 'BlockStatement',
	body: t.Array(Statement)
});

const Function = om.type('Function', Node, {
	id: t.Sum(Identifier, t.Null),
	params: t.Array(Identifier),
	body: BlockStatement
});

const ExpressionStatement = om.type('ExpressionStatement', Statement, {
	type: 'ExpressionStatement',
	expression: Statement
});

const ReturnStatement = om.type('ReturnStatement', Statement, {
	type: 'ReturnStatement',
	argument: t.Sum(Expression, t.Null)
});

const FunctionExpression = om.type('FunctionExpression', t.Product(Function, Expression), {
	type: 'FunctionExpression'
});

const CallExpression = om.type('CallExpression', Expression, {
	type: 'CallExpression',
	callee: Expression,
	arguments: t.Array(Expression)
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
