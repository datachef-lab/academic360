// Simple test script to verify the generateExport function
const { generateExport } = require("./apps/backend/dist/features/user/services/student.service.js");

async function testExport() {
  try {
    console.log("Starting export test...");
    const result = await generateExport();
    console.log(`Export completed. Found ${result.length} students`);
    if (result.length > 0) {
      console.log("Sample record keys:", Object.keys(result[0]));
      console.log("Sample record:", JSON.stringify(result[0], null, 2));
    }
  } catch (error) {
    console.error("Export failed:", error);
  }
}

testExport();
