// Test script to check actual database structure
const axios = require("axios");

async function testQuery() {
  try {
    // Test a simple query to see what columns exist
    console.log("Testing a simple query to diagnostic_sessions...");

    // Try to get existing problems first
    const problemsResponse = await axios.get(
      "http://localhost:3000/api/v1/problems?page=1&limit=1",
    );

    if (problemsResponse.data.data && problemsResponse.data.data.length > 0) {
      const problemId = problemsResponse.data.data[0].id;
      console.log(`Testing with problem ID: ${problemId}`);

      // This will trigger the canDelete method and show us the exact error
      const deleteResponse = await axios.delete(
        `http://localhost:3000/api/v1/problems/${problemId}?force=false`,
      );
    }
  } catch (error) {
    if (error.response) {
      console.log("Error status:", error.response.status);
      console.log("Error data:", error.response.data);
      console.log("Server logs should show the column error details");
    } else {
      console.log("Error:", error.message);
    }
  }
}

testQuery();
