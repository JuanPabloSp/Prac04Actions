// Sample Node.js Application
function calculateSum(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Arguments must be numbers');
    }
    return a + b;
}

function getSystemStatus() {
    return {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };
}

module.exports = { calculateSum, getSystemStatus };

if (require.main === module) {
    console.log("Starting App...");
    console.log("Status:", JSON.stringify(getSystemStatus(), null, 2));
}
