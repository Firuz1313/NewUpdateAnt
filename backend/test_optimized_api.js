#!/usr/bin/env node

/**
 * Test Optimized TV Interfaces API
 *
 * This script tests the optimized TV interfaces API to ensure:
 * 1. List endpoint doesn't return screenshot_data (faster response)
 * 2. Individual endpoint returns full data including screenshot_data
 * 3. Creation with large images works with timeout optimizations
 */

import http from "http";

// Make HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        const duration = Date.now() - startTime;
        try {
          const response = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: response,
            duration,
            size: responseData.length,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            duration,
            size: responseData.length,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

// Test functions
async function testGetAllTVInterfaces() {
  console.log("📋 Testing GET /api/v1/tv-interfaces (optimized list)...");

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/tv-interfaces",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await makeRequest(options);
    const sizeInMB = (response.size / 1024 / 1024).toFixed(2);

    console.log(`   ⏱️ Duration: ${response.duration}ms`);
    console.log(`   📏 Response size: ${sizeInMB}MB`);
    console.log(`   📊 Status: ${response.statusCode}`);

    if (response.statusCode === 200 && response.data.success) {
      const interfaces = response.data.data;
      console.log(`   📦 Interfaces count: ${interfaces.length}`);

      // Check if any interface has screenshot_data (should be null)
      const hasScreenshotData = interfaces.some(
        (iface) => iface.screenshot_data,
      );
      const hasScreenshotInfo = interfaces.some(
        (iface) => iface.has_screenshot_data !== undefined,
      );

      console.log(
        `   🖼️ Contains screenshot_data: ${hasScreenshotData ? "❌ Yes (not optimized)" : "✅ No (optimized)"}`,
      );
      console.log(
        `   ℹ️ Contains screenshot info: ${hasScreenshotInfo ? "✅ Yes" : "❌ No"}`,
      );

      return interfaces.length > 0 ? interfaces[0].id : null;
    } else {
      console.log(`   ❌ Failed: ${response.data.error || "Unknown error"}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return null;
  }
}

async function testGetTVInterfaceById(id) {
  if (!id) {
    console.log("⏭️ Skipping individual interface test (no ID available)");
    return;
  }

  console.log(`\n🔍 Testing GET /api/v1/tv-interfaces/${id} (full data)...`);

  const options = {
    hostname: "localhost",
    port: 3000,
    path: `/api/v1/tv-interfaces/${id}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await makeRequest(options);
    const sizeInMB = (response.size / 1024 / 1024).toFixed(2);

    console.log(`   ⏱️ Duration: ${response.duration}ms`);
    console.log(`   📏 Response size: ${sizeInMB}MB`);
    console.log(`   📊 Status: ${response.statusCode}`);

    if (response.statusCode === 200 && response.data.success) {
      const iface = response.data.data;
      const hasScreenshotData = !!iface.screenshot_data;
      const screenshotSize = hasScreenshotData
        ? (iface.screenshot_data.length / 1024 / 1024).toFixed(2)
        : "0";

      console.log(
        `   🖼️ Contains screenshot_data: ${hasScreenshotData ? "✅ Yes" : "❌ No"}`,
      );
      console.log(`   📷 Screenshot size: ${screenshotSize}MB`);
    } else {
      console.log(`   ❌ Failed: ${response.data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
}

async function testCreateTVInterface() {
  console.log(
    "\n➕ Testing POST /api/v1/tv-interfaces (optimized creation)...",
  );

  // Create a small test image
  const testImageData =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  const interfaceData = {
    name: "Optimized Test Interface",
    description: "Test interface created with optimizations",
    type: "custom",
    device_id: "test-device-unique-final",
    screenshot_data: testImageData,
  };

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/tv-interfaces",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const postData = JSON.stringify(interfaceData);

  try {
    const response = await makeRequest(options, postData);

    console.log(`   ⏱️ Duration: ${response.duration}ms`);
    console.log(`   📊 Status: ${response.statusCode}`);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ Success: ${response.data.message}`);
      console.log(`   📝 Created interface: ${response.data.data?.name}`);
      console.log(
        `   ⏱️ Processing time: ${response.data.processingTime || "N/A"}`,
      );
    } else {
      console.log(`   ❌ Failed: ${response.data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting API optimization tests...\n");

  const interfaceId = await testGetAllTVInterfaces();
  await testGetTVInterfaceById(interfaceId);
  await testCreateTVInterface();

  console.log("\n🎉 All tests completed!");
  console.log("\n📊 Summary:");
  console.log("   - List endpoint should be fast (<1s) and small (<1MB)");
  console.log("   - Individual endpoint includes full screenshot data");
  console.log("   - Creation endpoint supports timeout optimizations");
}

runAllTests().catch((error) => {
  console.error("❌ Test suite failed:", error.message);
  process.exit(1);
});
