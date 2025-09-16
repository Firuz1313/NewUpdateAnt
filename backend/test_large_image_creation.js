#!/usr/bin/env node

/**
 * Test Large Image Creation for TV Interfaces
 *
 * This script tests the creation of TV interfaces with progressively larger images
 * to verify that timeout optimizations work correctly.
 */

import http from "http";

// Generate base64 test image of specified size (approximate)
function generateTestImageBase64(targetSizeKB) {
  const prefix = "data:image/jpeg;base64,";
  const baseData =
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  // Calculate how much more data we need to reach target size
  const currentSize = prefix.length + baseData.length;
  const targetSize = targetSizeKB * 1024;

  if (targetSize <= currentSize) {
    return prefix + baseData;
  }

  // Add repeated data to reach target size
  const additionalChars = targetSize - currentSize;
  const padding = "A".repeat(Math.floor(additionalChars));

  return prefix + baseData + padding;
}

// Make HTTP POST request
function createTVInterface(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/tv-interfaces",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 300000, // 5 minutes
    };

    console.log(
      `📡 Making POST request with ${Math.round(postData.length / 1024)}KB payload...`,
    );

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: response,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

// Test different image sizes
async function testImageSizes() {
  const testSizes = [
    { name: "Small (10KB)", sizeKB: 10 },
    { name: "Medium (100KB)", sizeKB: 100 },
    { name: "Large (1MB)", sizeKB: 1024 },
    { name: "Very Large (5MB)", sizeKB: 5 * 1024 },
    { name: "Huge (9MB)", sizeKB: 9 * 1024 },
  ];

  console.log(
    "🚀 Starting TV Interface creation tests with different image sizes...\n",
  );

  for (const test of testSizes) {
    try {
      console.log(`📊 Testing ${test.name} image...`);
      const startTime = Date.now();

      const screenshot_data = generateTestImageBase64(test.sizeKB);
      const actualSizeKB = Math.round(screenshot_data.length / 1024);

      const interfaceData = {
        name: `Test Interface ${test.name}`,
        description: `Test interface with ${test.name} screenshot`,
        type: "custom",
        device_id: "test-device-unique-final",
        screenshot_data,
      };

      console.log(`   📷 Actual screenshot size: ${actualSizeKB}KB`);

      const response = await createTVInterface(interfaceData);
      const duration = Date.now() - startTime;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`   ✅ Success in ${duration}ms`);
        console.log(`   📝 Created interface: ${response.data.data?.name}`);
        console.log(
          `   ⏱️ Processing time: ${response.data.processingTime || "N/A"}`,
        );
      } else {
        console.log(`   ❌ Failed with status ${response.statusCode}`);
        console.log(`   📄 Error: ${response.data.error || response.data}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    console.log(""); // Empty line for readability

    // Wait 2 seconds between tests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("🎉 All tests completed!");
}

// Run the tests
testImageSizes().catch((error) => {
  console.error("❌ Test suite failed:", error.message);
  process.exit(1);
});
