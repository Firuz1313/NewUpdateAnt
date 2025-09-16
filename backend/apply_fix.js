import database from "./src/utils/database.js";
import fs from "fs";

async function applyFix() {
  try {
    console.log("🔧 Applying database schema fix...");

    // Read the SQL fix file
    const sqlFix = fs.readFileSync("./fix_tv_interfaces.sql", "utf8");

    // Execute the SQL fix
    const result = await database.query(sqlFix);
    console.log("✅ Database schema fix applied successfully");

    // Show any notices/messages
    if (result.rows && result.rows.length > 0) {
      console.log("📊 Current tv_interfaces table structure:");
      result.rows.forEach((row) => {
        console.log(
          `  ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`,
        );
      });
    }
  } catch (error) {
    console.error("❌ Error applying fix:", error.message);
  } finally {
    await database.closePool();
  }
}

applyFix();
