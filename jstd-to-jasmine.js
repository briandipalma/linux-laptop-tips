// yarn jscodeshift packages-caplin/cps-charts/_test-ut/actionhandlers/chartDragDataDroppedTest.js
const TEST_CASE_CALL_FILTER = { callee: { name: "TestCase" } };
const ASYNC_TEST_CASE_CALL_FILTER = { callee: { name: "AsyncTestCase" } };
const ASSERT_EQUALS_FILTER = { callee: { name: "assertEquals" } };
const ASSERT_STRING = { callee: { name: "assertString" } };
const ASSERT_TRUE_CALL_FILTER = { callee: { name: "assertTrue" } };
const ASSERT_FALSE_CALL_FILTER = { callee: { name: "assertFalse" } };
const ASSERT_EXCEPTION = { callee: { name: "assertException" } };
const ASSERT_NULL = { callee: { name: "assertNull" } };
const ASSERT_UNDEFINED = { callee: { name: "assertUndefined" } };
const ASSERT_NO_EXCEPTION = { callee: { name: "assertNoException" } };
const ASSERT_NOT_EQUALS = { callee: { name: "assertNotEquals" } };

function getTestName(root, testNameArg, j) {
  // TestCase(**testName**, testCase);
  if (testNameArg.type === "Identifier") {
    // **var testName** = "SomeTests";
    const nameDeclarators = root.findVariableDeclarators(testNameArg.name);

    return {
      // var testName = **"SomeTests"**;
      testName: nameDeclarators.find(j.Literal).get().value.value,
      // **var testName** = "SomeTests";
      testNameDeclarator: nameDeclarators,
    };
  }

  // TestCase(**"testName"**, testCase); the test name is a string literal
  if (testNameArg.type === "Literal") {
    return {
      // TestCase(**"testName"**, testCase);
      testName: testNameArg.value,
    };
  }

  throw new Error("Unimplemented getTestName");
}

function getTestsVarNodes(node, root, testCaseExpressionStatement) {
  if (node.type === "Identifier") {
    // var **testCase** = {...}
    const testsVarDeclarator = root.findVariableDeclarators(node.name);

    return {
      // var **testCase** = {...}
      variableDeclarator: testsVarDeclarator.get(),
      // **var** testCase = {...} - "VariableDeclaration"
      variableDeclaration: testsVarDeclarator.get().parent,
    };
  }

  // TestCase("Name", **{ "test ..."() {} }**)
  if (node.type === "ObjectExpression") {
    return {
      variableDeclarator: node,
      // **TestCase("Name", { "test ..."() {} })**
      variableDeclaration: testCaseExpressionStatement,
    };
  }

  if (node.value.type === "VariableDeclarator") {
    return {
      // var **testCase** = TestCase("")
      variableDeclarator: node.get(),
      // **var** testCase = TestCase("") - "VariableDeclaration"
      variableDeclaration: node.get().parent,
    };
  }

  // `var ATest = TestCase("ATest").prototype;` path
  if (node.value.type === "MemberExpression") {
    return {
      // var **ATest** = TestCase("ATest").prototype;
      variableDeclarator: node.parent,
      // **var** ATest = TestCase("ATest").prototype; - "VariableDeclaration"
      variableDeclaration: node.parent.parentPath.parentPath,
    };
  }

  throw new Error(`Unimplemented getTestsVarNodes:: ${node.type}`);
}

function getTestsDeclaration(tests, root, testCaseExpressionStatement) {
  // sinon.testCase(testCase) path.
  if (tests.type === "CallExpression") {
    const callArg = tests.arguments[0];

    // sinon.testCase(**testCase**) path
    return getTestsVarNodes(callArg, root);
  }

  // TestCase(testCaseName, testCase); and TestCase(testCaseName, {...}); path
  return getTestsVarNodes(tests, root, testCaseExpressionStatement);
}

function getTestFunctionData(property) {
  // **aTest.prototype.testSomething = function() { ... }**
  if (property.type === "AssignmentExpression") {
    // aTest[**"test Something"**] = function() { ... }
    if (property.left.property.type === "Literal") {
      return [property.left.property.value, property.right];
    }

    return [property.left.property.name, property.right];
  }

  // "test ...": function() { ... } path
  if (property.key.type === "Literal") {
    return [property.key.value, property.value];
  }

  // setUp: function() { ... } path
  if (property.key.type === "Identifier") {
    return [property.key.name, property.value];
  }

  throw new Error("getTestFunctionData");
}

function mapJSTDFunctionName(name) {
  if (name === "setUp") {
    return "beforeEach";
  }

  if (name === "tearDown") {
    return "afterEach";
  }
}

function createTestExpressionStatement(j, property) {
  const [functionName, functionArgs] = getTestFunctionData(property);
  const globalJasmineFunctionName = mapJSTDFunctionName(functionName);

  if (globalJasmineFunctionName) {
    return j.expressionStatement(
      j.callExpression(j.identifier(globalJasmineFunctionName), [functionArgs])
    );
  }

  return j.expressionStatement(
    j.callExpression(j.identifier("it"), [
      j.literal(functionName),
      functionArgs,
    ])
  );
}

function createTestExpressionWithComments(
  j,
  property,
  expressionStatementNode
) {
  const expressionStatement = createTestExpressionStatement(j, property);

  expressionStatement.trailingComments =
    expressionStatementNode.trailingComments;
  expressionStatement.comments = expressionStatementNode.comments;

  return expressionStatement;
}

function getJSTDTestFunctions(variableDeclarator, root, j) {
  let variableValue;

  // TestCase("Name", **{ "test ..."() {} }**)
  if (variableDeclarator.type === "ObjectExpression") {
    variableValue = variableDeclarator;
  } else {
    variableValue = variableDeclarator.value.init;
  }

  /**
   * var **aTest** = TestCase("testName"); path
   * aTest.prototype.testSomething = function() { ... }
   */
  if (variableValue.type === "CallExpression") {
    const testCaseFilter = { name: variableValue.arguments[0].value };
    const identifiers = root.find(j.Identifier, testCaseFilter);
    // Filter the declaration identifier out
    const testIdentifiers = identifiers.filter(
      (path) => path.value !== variableDeclarator.value.id
    );
    // **aTest.prototype.testSomething = function() { ... }**
    const testAssignmentExpressions = testIdentifiers.map(
      (path) => path.parent.parent.parent
    );

    return [testAssignmentExpressions.nodes(), testAssignmentExpressions];
  }

  /**
   * var **aTest** = TestCase("testName").prototype; path
   * aTest.testSomething = function() { ... }
   */
  if (variableValue.type === "MemberExpression") {
    const testCaseFilter = { name: variableDeclarator.value.id.name };
    const identifiers = root.find(j.Identifier, testCaseFilter);
    // Filter the declaration identifier out
    const testIdentifiers = identifiers.filter(
      (path) => path.value !== variableDeclarator.value.id
    );
    // **aTest.testSomething = function() { ... }**
    const testAssignmentExpressions = testIdentifiers.map((path) => {
      return path.parent.parent;
    });

    return [testAssignmentExpressions.nodes(), testAssignmentExpressions];
  }

  // Else `test = { ... }` case
  return [variableValue.properties];
}

function convertJSTDTestsToJasmine(variableDeclarator, j, testName, root) {
  const [testFunctions, testAssignmentExpressions] = getJSTDTestFunctions(
    variableDeclarator,
    root,
    j
  );
  const testsExpressionStatements = testFunctions.map((property, index) => {
    const nodePath = testAssignmentExpressions.at(index).get();
    const expressionStatementNode = nodePath.parent.value;

    return createTestExpressionWithComments(
      j,
      property,
      expressionStatementNode
    );
  });

  return [
    j.expressionStatement(
      j.callExpression(j.identifier("describe"), [
        j.literal(testName),
        j.arrowFunctionExpression(
          [],
          j.blockStatement(testsExpressionStatements),
          false
        ),
      ])
    ),
    testAssignmentExpressions,
  ];
}

function removeIIFE(root) {
  const body = root.get().value.program.body;

  if (body.length === 1) {
    const expressionStatement = body[0];

    if (expressionStatement.type === "ExpressionStatement") {
      const callExpression = expressionStatement.expression;

      // If the only node in program body is a call it's probably an IIFE
      if (callExpression.type === "CallExpression") {
        body.push(...callExpression.callee.body.body);
        body.shift();
      }
    }
  }
}

function insertJasmineTests(variableDeclaration, jasmineTests) {
  // The tests can be contained in an Expression TestCase("", {...}) or can be
  // pointed to by a variable declarator. This case covers both as long as the
  // variable declarator is sharing a declaration `var f = 10, tests = { ... }`
  if (
    variableDeclaration.value.type === "ExpressionStatement" ||
    variableDeclaration.value.declarations.length > 1
  ) {
    const parentNode = variableDeclaration.parent.value;
    const declarationIndex = parentNode.body.indexOf(variableDeclaration.value);

    // Put the Jasmine tests after the shared var declaration/expression
    parentNode.body.splice(declarationIndex + 1, 0, jasmineTests);
  }
  // If the test declarator is stand alone `var tests = { ... };`
  else if (variableDeclaration.value.declarations.length === 1) {
    variableDeclaration.replace(jasmineTests);
  } else {
    throw new Error(`insertJasmineTests: ${variableDeclaration.type}`);
  }
}

function removeJSTDCode(
  testNameDeclarator,
  variableDeclarator,
  testAssignmentExpressions
) {
  // Remove the JSTD test name declaration `var testName = "SomeTest"`, check if
  // the variable exists as in some cases the name is provided as string literal
  if (testNameDeclarator) {
    testNameDeclarator.get().prune();
  }

  // This only has an effect in the case the declarator is sharing a declaration
  // e.g. `var *tests = { ... }*, x = 10, ...`; if it's standalone it's replaced
  // ObjectExpressions don't have `get` e.g. TestCase("", **{...}**)
  if (variableDeclarator.get) {
    variableDeclarator.get().prune();
  }

  // Possible **aTest.prototype.testSomething = function() { ... }**
  if (testAssignmentExpressions) {
    testAssignmentExpressions.map((testAssignmentExpression) =>
      testAssignmentExpression.prune()
    );
  }
}

function findTestNameAndTests(testCaseCall) {
  // `var aTest = TestCase("name");` path
  if (testCaseCall.get().value.arguments.length === 1) {
    // First argument in array is name `var aTest = TestCase(**"name"**);`
    // second part is var declarator `var **aTest** = TestCase(**"name"**);`
    return [testCaseCall.get().value.arguments[0], testCaseCall.get().parent];
  }

  // `TestCase("name", tests)` path
  return testCaseCall.get().value.arguments;
}

function findJSTDTestCaseCall(root, j) {
  // Find the JSTD `TestCase()` call expression
  const testCaseCall = root.find(j.CallExpression, TEST_CASE_CALL_FILTER);

  if (testCaseCall.length > 0) {
    return testCaseCall;
  }

  // Find the JSTD `new TestCase()` call expression
  const newtestCaseCall = root.find(j.NewExpression, TEST_CASE_CALL_FILTER);

  if (newtestCaseCall.length > 0) {
    return newtestCaseCall;
  }

  // Find the JSTD `AsyncTestCase()` call expression
  const asyncTest = root.find(j.CallExpression, ASYNC_TEST_CASE_CALL_FILTER);

  if (asyncTest.length > 0) {
    return asyncTest;
  }
}

function standardActual(assertCall) {
  // actual is the last argument in most assertions
  return [assertCall.value.arguments[assertCall.value.arguments.length - 1]];
}

function replaceAssertions(
  root,
  j,
  filter,
  matcher,
  expected = () => [],
  actual = standardActual,
  not
) {
  // Find the JSTD assertion call expressions
  const assertCall = root.find(j.CallExpression, filter);

  if (assertCall.length > 0) {
    assertCall.map((aC) => {
      let expect = j.callExpression(j.identifier("expect"), actual(aC));

      if (not) {
        expect = j.memberExpression(expect, j.identifier("not"));
      }

      return aC.replace(
        j.callExpression(
          j.memberExpression(expect, j.identifier(matcher)),
          expected(aC)
        )
      );
    });
  }
}

function findAndReplaceJSTDAssertions(root, j) {
  const toBeStringArgs = () => [j.identifier("String")];
  // expected value is second last argument in assertions that have one
  const expected = (aC) => [aC.value.arguments[aC.value.arguments.length - 2]];
  const errorE = (aC) => [aC.value.arguments[aC.value.arguments.length - 1]];
  const errorA = (aC) => [aC.value.arguments[aC.value.arguments.length - 2]];

  // JSTD `assertEquals()` call expressions
  replaceAssertions(root, j, ASSERT_EQUALS_FILTER, "toEqual", expected);
  // JSTD `assertString()` call expressions
  replaceAssertions(root, j, ASSERT_STRING, "toBeInstanceOf", toBeStringArgs);
  //  JSTD `assertTrue()` call expressions
  replaceAssertions(root, j, ASSERT_TRUE_CALL_FILTER, "toBeTruthy");
  // JSTD `assertFalse()` call expressions
  replaceAssertions(root, j, ASSERT_FALSE_CALL_FILTER, "toBeFalsy");
  // JSTD `assertException()` call expressions
  // assertException([msg], callback, error)
  replaceAssertions(root, j, ASSERT_EXCEPTION, "toThrowError", errorE, errorA);
  // JSTD `assertNull()` call expressions
  replaceAssertions(root, j, ASSERT_NULL, "toBeNull");
  replaceAssertions(root, j, ASSERT_UNDEFINED, "toBeUndefined");
  replaceAssertions(
    root,
    j,
    ASSERT_NOT_EQUALS,
    "toEqual",
    expected,
    undefined,
    true
  );

  // Find the pointless JSTD assertion call expression
  const assertNoErrorCall = root.find(j.CallExpression, ASSERT_NO_EXCEPTION);

  if (assertNoErrorCall.length > 0) {
    assertNoErrorCall.map((aCall) => {
      const expressionStatement = aCall.parent;
      const parentNode = expressionStatement.parent.value;
      const statementIndex = parentNode.body.indexOf(expressionStatement.value);

      let assertCallBody;

      // assertNoException(***"message"***, function () { ... }
      if (aCall.value.arguments[0].type === "Literal") {
        assertCallBody = aCall.value.arguments[1].body.body;
      } else {
        assertCallBody = aCall.value.arguments[0].body.body;
      }

      // Put the assert function contents after the assert call
      parentNode.body.splice(statementIndex + 1, 0, ...assertCallBody);
      // Remove the assertion call (an expression statement) parent
      expressionStatement.replace();
    });
  }
}

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const testCaseCall = findJSTDTestCaseCall(root, j);

  // These assertions can be used even in Jasmine tests
  findAndReplaceJSTDAssertions(root, j);

  if (testCaseCall === undefined) {
    return root.toSource();
  }

  // Find the JSTD test name and tests `TestCase("name", tests)`
  const [testNameArg, testsArg] = findTestNameAndTests(testCaseCall);
  // Get the test name string literal and the test name var declaration
  const { testName, testNameDeclarator } = getTestName(root, testNameArg, j);
  // Get tests declarator `var *tests = {}*` and declaration `*var tests = {}*`
  const { variableDeclarator, variableDeclaration } = getTestsDeclaration(
    testsArg,
    root,
    testCaseCall.get().parent
  );
  // Transform the JSTD tests into Jasmine (`describe`/`it`) tests
  const [jasmineTests, testAssignmentExpressions] = convertJSTDTestsToJasmine(
    variableDeclarator,
    j,
    testName,
    root
  );

  // Replace the JSTD tests declaration with the Jasmine ones
  insertJasmineTests(variableDeclaration, jasmineTests);
  // Remove the JSTD `TestCase()` call expression
  testCaseCall.remove();
  // Remove the JSTD test name declarator `var *testName = "ATest"*` and tests
  // declarator `var *tests = { ... }*, x = 10, ...`
  removeJSTDCode(
    testNameDeclarator,
    variableDeclarator,
    testAssignmentExpressions
  );
  // If the test is wrapped in an IIFE remove it
  removeIIFE(root);

  // ("use strict");

  return root.toSource();
}
