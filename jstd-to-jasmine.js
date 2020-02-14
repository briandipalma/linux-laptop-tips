const TEST_CASE_CALL_FILTER = { callee: { name: "TestCase" } };

function getTestName(root, testNameArg, j) {
  // TestCase(**testName**, testCase);
  if (testNameArg.type === "Identifier") {
    // **var testName** = "SomeTests";
    const nameDeclarators = root.findVariableDeclarators(testNameArg.name);

    // var testName = **"SomeTests"**;
    return nameDeclarators.find(j.Literal).get().value.value;
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
        variableDeclarator: testsVarDeclarator.get(),
        // **var** testCase = {...} - "VariableDeclaration"
        variableDeclaration: testsVarDeclarator.get().parent
      };
    }

    throw new Error("Unimplemented getTestProperties 2");
  }

  throw new Error("Unimplemented getTestProperties");
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

  throw new Error("");
}

function gggg(variableDeclarator, j, testName) {
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

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const testCaseCall = root.find(j.CallExpression, TEST_CASE_CALL_FILTER);
  const [testNameArg, tests] = testCaseCall.get().value.arguments;

  const testName = getTestName(root, testNameArg, j);
  debugger;
  const { variableDeclarator, variableDeclaration } = getTestsDeclaration(
    tests,
    root
  );

  //   testCaseCall.remove

  const u = gggg(variableDeclarator, j, testName);

  variableDeclaration.replace(u);

  return root.toSource();

  //   return testsDeclarations
  //     .replaceWith(p => {
  //       const testsExpressionStatements = p.value.init.properties.map(property =>
  //         createTestExpressionStatement(j, property)
  //       );

  //       return j.callExpression(j.identifier("describe"), [
  //         j.literal(testName),
  //         j.arrowFunctionExpression(
  //           [],
  //           j.blockStatement(testsExpressionStatements),
  //           false
  //         )
  //       ]);
  //     })
  //     .toSource();
}
