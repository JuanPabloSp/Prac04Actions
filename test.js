// Lightweight test runner using Node.js assert module
const assert = require('assert');
const { calculateSum, getSystemStatus } = require('./index');

console.log("=== RUNNING APPLICATION TESTS ===");

try {
    // Test 1: calculateSum correctly adds numbers
    console.log("Running Test 1: calculateSum correctly adds numbers...");
    const sumResult = calculateSum(5, 7);
    assert.strictEqual(sumResult, 12, "calculateSum(5, 7) should be 12");
    console.log("✅ Test 1 Passed!");

    // Test 2: calculateSum throws error on invalid inputs
    console.log("Running Test 2: calculateSum throws error on invalid inputs...");
    assert.throws(() => {
        calculateSum("5", 7);
    }, /Arguments must be numbers/, "Should throw type error");
    console.log("✅ Test 2 Passed!");

    // Test 3: getSystemStatus returns healthy status
    console.log("Running Test 3: getSystemStatus returns healthy status...");
    const status = getSystemStatus();
    assert.strictEqual(status.status, "healthy", "System status should be healthy");
    assert.ok(status.uptime >= 0, "Uptime should be a non-negative number");
    console.log("✅ Test 3 Passed!");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! (3/3)");
    process.exit(0);

} catch (error) {
    console.error("\n❌ TEST FAILURE DETECTED:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
}
