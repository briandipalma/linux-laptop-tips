const TEST_CASE_CALL_FILTER = { callee: { name: "TestCase" } };

function getTestName(root, testNameArg, j) {
  // TestCase(**testName**, testCase);
  if (testNameArg.type === "Identifier") {
    // **var testName** = "SomeTests";
    const nameDeclarators = root.findVariableDeclarators(testNameArg.name);

    return {
      // var testName = **"SomeTests"**;
      testName: nameDeclarators.find(j.Literal).get().value.value,
      // **var testName** = "SomeTests";
      testNameDeclarator: nameDeclarators
    };
  }

  throw new Error("Unimplemented getTestName");
}

function getTestsDeclaration(tests, root) {
  // sinon.testCase() path.
  if (tests.type === "CallExpression") {
    const callArg = tests.arguments[0];

    // sinon.testCase(**testCase**) path
    if (callArg.type === "Identifier") {
      // var **testCase** = {...}
      const testsVarDeclarator = root.findVariableDeclarators(callArg.name);

      return {
        // var **testCase** = {...}
        variableDeclarator: testsVarDeclarator.get(),
        // **var** testCase = {...} - "VariableDeclaration"
        variableDeclaration: testsVarDeclarator.get().parent
      };
    }

    throw new Error("Unimplemented getTestsDeclaration 2");
  }

  throw new Error("Unimplemented getTestsDeclaration");
}

function getFunctionName(name) {
  if (name === "setUp") {
    return "beforeEach";
  }

  if (name === "tearDown") {
    return "afterEach";
  }

  throw new Error("getFunctionName");
}

function createTestExpressionStatement(j, property) {
  // "test ...": function() { ... } path
  if (property.key.type === "Literal") {
    const testName = property.key.value;

    return j.expressionStatement(
      j.callExpression(j.identifier("it"), [
        j.literal(testName),
        j.arrowFunctionExpression([], property.value.body, false)
      ])
    );
  }

  // setUp: function() { ... } path
  if (property.key.type === "Identifier") {
    const functionName = getFunctionName(property.key.name);

    return j.expressionStatement(
      j.callExpression(j.identifier(functionName), [
        j.arrowFunctionExpression([], property.value.body, false)
      ])
    );
  }

  throw new Error("createTestExpressionStatement");
}

function convertJSTDTestsToJasmine(variableDeclarator, j, testName) {
  const testsExpressionStatements = variableDeclarator.value.init.properties.map(
    property => createTestExpressionStatement(j, property)
  );

  return j.expressionStatement(
    j.callExpression(j.identifier("describe"), [
      j.literal(testName),
      j.arrowFunctionExpression(
        [],
        j.blockStatement(testsExpressionStatements),
        false
      )
    ])
  );
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

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  // Find the JSTD `TestCase()` call expression
  const testCaseCall = root.find(j.CallExpression, TEST_CASE_CALL_FILTER);
  // Find the JSTD test name and tests `TestCase("name", tests)`
  const [testNameArg, testsArg] = testCaseCall.get().value.arguments;
  // Get the test name string literal and the test name var declaration
  const { testName, testNameDeclarator } = getTestName(root, testNameArg, j);
  // Get tests declarator `var *tests = {}*` and declaration `*var tests = {}*`
  const { variableDeclarator, variableDeclaration } = getTestsDeclaration(
    testsArg,
    root
  );
  // Transform the JSTD tests into Jasmine (`describe`/`it`) tests
  const jasmineTests = convertJSTDTestsToJasmine(
    variableDeclarator,
    j,
    testName
  );

  // Replace the JSTD tests declaration with the Jasmine ones
  variableDeclaration.replace(jasmineTests);
  // Remove the JSTD `TestCase()` call expression
  testCaseCall.remove();
  // Remove the JSTD test name declaration `var testName = "SomeTest"`
  testNameDeclarator.get().parent.prune();
  // If the test is wrapped in an IIFE remove it
  removeIIFE(root);

  return root.toSource();
}
