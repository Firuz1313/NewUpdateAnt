#!/usr/bin/env node

// Simple test script to verify remote creation works
const http = require("http");

const testData = {
  name: "Test Remote",
  manufacturer: "Test Manufacturer",
  model: "Test Model",
  description: "Test remote for validation",
  layout: "standard",
  color_scheme: "dark",
  dimensions: { width: 400, height: 600 },
  buttons: [],
  zones: [],
  is_default: false,
  is_active: true,
};

const postData = JSON.stringify(testData);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/v1/remotes",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

console.log("Testing remote creation...");

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:");
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));

      if (response.success) {
        console.log("\n✅ Remote creation test PASSED!");
        console.log(`Created remote with ID: ${response.data.id}`);
      } else {
        console.log("\n❌ Remote creation test FAILED!");
        console.log("Error:", response.error);
      }
    } catch (error) {
      console.log("Raw response:", data);
      console.log("Parse error:", error);
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
