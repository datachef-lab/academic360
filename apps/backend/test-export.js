import axios from "axios";
import fs from "fs";

// Test the CU Registration Correction Requests Export API
async function testExportAPI() {
  try {
    console.log("🔍 Testing CU Registration Correction Requests Export API...");

    const response = await axios.get(
      "http://localhost:8080/api/admissions/cu-registration-correction-requests/export",
      {
        responseType: "arraybuffer", // Important for binary data
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      },
    );

    console.log("✅ Export API Response:");
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers["content-type"]);
    console.log("Content-Length:", response.headers["content-length"]);
    console.log(
      "Content-Disposition:",
      response.headers["content-disposition"],
    );

    // Save the Excel file
    const filename = `cu-registration-corrections-test-${new Date().toISOString().split("T")[0]}.xlsx`;
    fs.writeFileSync(filename, response.data);
    console.log(`📁 Excel file saved as: ${filename}`);
    console.log(`📊 File size: ${response.data.length} bytes`);

    // Check if file was created successfully
    if (fs.existsSync(filename)) {
      console.log("✅ File created successfully!");
      console.log(
        "📋 You can now open the Excel file to verify the export functionality.",
      );
    } else {
      console.log("❌ File creation failed!");
    }
  } catch (error) {
    console.error("❌ Export API Test Failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Status Text:", error.response.statusText);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received. Is the server running?");
      console.error("Make sure to start the server with: npm run dev");
    } else {
      console.error("Error:", error.message);
    }
  }
}

// Run the test
testExportAPI();
