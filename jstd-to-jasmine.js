// yarn jscodeshift packages-caplin/cps-charts/_test-ut/actionhandlers/chartDragDataDroppedTest.js
const TEST_CASE_CALL_FILTER = { callee: { name: "TestCase" } };
const ASYNC_TEST_CASE_CALL_FILTER = { callee: { name: "AsyncTestCase" } };

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

function getTestsVarNodes(node, root) {
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

  if (node.value.type === "VariableDeclarator") {
    return {
      // var **testCase** = TestCase("")
      variableDeclarator: node.get(),
      // **var** testCase = TestCase("") - "VariableDeclaration"
      variableDeclaration: node.get().parent,
    };
  }

  throw new Error("Unimplemented getTestsDeclaration 2");
}

function getTestsDeclaration(tests, root) {
  // sinon.testCase(testCase) path.
  if (tests.type === "CallExpression") {
    const callArg = tests.arguments[0];

    // sinon.testCase(**testCase**) path
    return getTestsVarNodes(callArg, root);
  }

  // TestCase(testCaseName, testCase); path
  return getTestsVarNodes(tests, root);
}

function getTestFunctionData(property) {
  if (property.type === "AssignmentExpression") {
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

  throw new Error("createTestExpressionStatement");
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

function getJSTDTestFunctions(variableDeclarator, root, j) {
  const variableValue = variableDeclarator.value.init;

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

  // Else `test = { ... }` case
  return [variableValue.properties];
}

function convertJSTDTestsToJasmine(variableDeclarator, j, testName, root) {
  const [testFunctions, testAssignmentExpressions] = getJSTDTestFunctions(
    variableDeclarator,
    root,
    j
  );
  const testsExpressionStatements = testFunctions.map((property) =>
    createTestExpressionStatement(j, property)
  );

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
  // If the test declarator is stand alone `var tests = { ... };`
  if (variableDeclaration.value.declarations.length === 1) {
    variableDeclaration.replace(jasmineTests);
    // Else the declarator is sharing a declaration `var f = 10, tests = { ... }`
  } else if (variableDeclaration.value.declarations.length > 1) {
    const parentNode = variableDeclaration.parent.value;
    const declarationIndex = parentNode.body.indexOf(variableDeclaration.value);

    // Put the Jasmine tests after the shared var declaration
    parentNode.body.splice(declarationIndex + 1, 0, jasmineTests);
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
  variableDeclarator.get().prune();

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

  // Find the JSTD `AsyncTestCase()` call expression
  const asyncTest = root.find(j.CallExpression, ASYNC_TEST_CASE_CALL_FILTER);

  if (asyncTest.length > 0) {
    return asyncTest;
  }
}

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const testCaseCall = findJSTDTestCaseCall(root, j);

  if (testCaseCall === undefined) {
    return;
  }

  // Find the JSTD test name and tests `TestCase("name", tests)`
  const [testNameArg, testsArg] = findTestNameAndTests(testCaseCall);
  // Get the test name string literal and the test name var declaration
  const { testName, testNameDeclarator } = getTestName(root, testNameArg, j);
  // Get tests declarator `var *tests = {}*` and declaration `*var tests = {}*`
  const { variableDeclarator, variableDeclaration } = getTestsDeclaration(
    testsArg,
    root
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

  return root.toSource();
}
