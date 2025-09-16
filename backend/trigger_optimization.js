#!/usr/bin/env node

/**
 * Trigger TV Interfaces Database Optimization via HTTP API
 * This script calls the optimization endpoint to create the necessary indexes
 */

import http from "http";
import https from "https";

// Get server URL from environment or use default
const serverUrl = process.env.SERVER_URL || "http://localhost:3001";
const apiUrl = `${serverUrl}/api/v1/optimization/tv-interfaces`;

console.log("🚀 Starting TV Interfaces Database Optimization...");
console.log(`📡 Server URL: ${serverUrl}`);

/**
 * Make HTTP request
 */
function makeRequest(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "TV-Interface-Optimizer/1.0",
      },
    };

    console.log(`📡 Making ${method} request to: ${url}`);

    const req = httpModule.request(options, (res) => {
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

    req.setTimeout(300000, () => {
      // 5 minute timeout
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * Run optimization steps
 */
async function runOptimization() {
  try {
    // 1. Check current optimization status
    console.log("\n📊 Checking current optimization status...");
    const statusResponse = await makeRequest(`${apiUrl}/status`);

    if (statusResponse.statusCode !== 200) {
      console.error(
        "❌ Failed to get optimization status:",
        statusResponse.data,
      );
      return;
    }

    const status = statusResponse.data.data;
    console.log(`📈 Current status:`);
    console.log(`   - Optimized: ${status.isOptimized ? "✅ Yes" : "❌ No"}`);
    console.log(`   - Table size: ${status.tableSize}`);
    console.log(`   - Total rows: ${status.totalRows}`);
    console.log(`   - Active rows: ${status.activeRows}`);
    console.log(`   - Large screenshots: ${status.largeScreenshots}`);

    if (status.missingIndexes && status.missingIndexes.length > 0) {
      console.log(`   - Missing indexes: ${status.missingIndexes.join(", ")}`);
    }

    // 2. Run optimization if needed
    if (!status.isOptimized || status.missingIndexes.length > 0) {
      console.log("\n🔧 Running database optimization...");
      const optimizeResponse = await makeRequest(`${apiUrl}/optimize`, "POST");

      if (
        optimizeResponse.statusCode === 200 ||
        optimizeResponse.statusCode === 201
      ) {
        console.log("✅ Optimization completed successfully!");
        console.log(
          "Results:",
          JSON.stringify(optimizeResponse.data.data, null, 2),
        );
      } else {
        console.error("❌ Optimization failed:", optimizeResponse.data);
        return;
      }
    } else {
      console.log("✅ Database is already optimized!");
    }

    // 3. Analyze large screenshots
    console.log("\n📷 Analyzing large screenshots...");
    const cleanupResponse = await makeRequest(
      `${apiUrl}/cleanup-screenshots?maxSizeMB=5`,
    );

    if (cleanupResponse.statusCode === 200) {
      const cleanup = cleanupResponse.data.data;
      console.log(`📊 Screenshot analysis:`);
      console.log(`   - Large screenshots found: ${cleanup.totalFound}`);
      if (cleanup.largeScreenshots.length > 0) {
        console.log(`   - Largest screenshots:`);
        cleanup.largeScreenshots.slice(0, 5).forEach((screenshot) => {
          console.log(
            `     ID: ${screenshot.id}, Size: ${screenshot.sizeMB}MB`,
          );
        });
        console.log(`   - Recommendation: ${cleanup.recommendation}`);
      }
    }

    // 4. Final status check
    console.log("\n📊 Final optimization status...");
    const finalStatusResponse = await makeRequest(`${apiUrl}/status`);

    if (finalStatusResponse.statusCode === 200) {
      const finalStatus = finalStatusResponse.data.data;
      console.log(`✅ Final status:`);
      console.log(
        `   - Optimized: ${finalStatus.isOptimized ? "✅ Yes" : "❌ No"}`,
      );
      console.log(`   - Indexes size: ${finalStatus.indexesSize}`);
      console.log(
        `   - Missing indexes: ${finalStatus.missingIndexes.length === 0 ? "None" : finalStatus.missingIndexes.join(", ")}`,
      );
    }

    console.log("\n🎉 TV Interfaces optimization completed!");
    console.log("💡 The timeout issues should now be resolved.");
  } catch (error) {
    console.error("❌ Optimization failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        "💡 Make sure the backend server is running on:",
        serverUrl,
      );
    }

    process.exit(1);
  }
}

// Check if server is reachable first
async function checkServer() {
  try {
    console.log("🔍 Checking server health...");
    const healthResponse = await makeRequest(`${serverUrl}/api/health`);

    if (healthResponse.statusCode === 200) {
      console.log("✅ Server is reachable");
      return true;
    } else {
      console.error("❌ Server health check failed:", healthResponse.data);
      return false;
    }
  } catch (error) {
    console.error("��� Cannot reach server:", error.message);
    return false;
  }
}

// Main execution
async function main() {
  const serverReachable = await checkServer();

  if (!serverReachable) {
    console.error(
      "💡 Please ensure the backend server is running and accessible.",
    );
    process.exit(1);
  }

  await runOptimization();
}

main().catch((error) => {
  console.error("❌ Script failed:", error.message);
  process.exit(1);
});
