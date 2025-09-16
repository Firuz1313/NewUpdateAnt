// Quick test to verify the problem deletion is fixed
const axios = require("axios");

async function testDeleteProblem() {
  try {
    // First try to get all problems to find one to delete
    console.log("Getting list of problems...");
    const response = await axios.get(
      "http://localhost:3000/api/v1/problems?page=1&limit=1",
    );

    if (response.data.data && response.data.data.length > 0) {
      const problemId = response.data.data[0].id;
      console.log(`Found problem to test deletion: ${problemId}`);

      // Try to delete it (this should trigger the canDelete method)
      console.log("Testing problem deletion...");
      const deleteResponse = await axios.delete(
        `http://localhost:3000/api/v1/problems/${problemId}?force=false`,
      );

      console.log("Delete response status:", deleteResponse.status);
      console.log("Delete response data:", deleteResponse.data);
    } else {
      console.log("No problems found to test with");
    }
  } catch (error) {
    if (error.response) {
      console.log("Error status:", error.response.status);
      console.log("Error data:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
}

testDeleteProblem();
