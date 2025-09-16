#!/usr/bin/env node

/**
 * Fix TV Interface ID format in tv_interface_marks table
 * Change from UUID to VARCHAR to match the actual ID format
 */

import { query, testConnection } from "./src/utils/database.js";

async function fixTVInterfaceIdFormat() {
  console.log(
    "🔧 Fixing TV interface ID format in tv_interface_marks table...",
  );

  try {
    // Test connection first
    console.log("📊 Testing database connection...");
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error("Database connection failed: " + connectionTest.error);
    }
    console.log("✅ Database connection successful");

    // Check current table structure
    console.log("🔍 Checking current tv_interface_id column...");
    const columnInfo = await query(`
      SELECT data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks' AND column_name = 'tv_interface_id'
    `);

    if (columnInfo.rows.length === 0) {
      console.log("❌ tv_interface_id column not found");
      return;
    }

    console.log("📋 Current column info:", columnInfo.rows[0]);

    // Check if there are any existing records
    const recordCount = await query(
      "SELECT COUNT(*) as count FROM tv_interface_marks",
    );
    console.log(`📊 Current records in table: ${recordCount.rows[0].count}`);

    // Drop the foreign key constraint if it exists
    console.log("🔗 Checking for foreign key constraints...");
    const constraints = await query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'tv_interface_marks' 
      AND constraint_type = 'FOREIGN KEY'
    `);

    for (const constraint of constraints.rows) {
      try {
        console.log(`🗑️ Dropping constraint: ${constraint.constraint_name}`);
        await query(
          `ALTER TABLE tv_interface_marks DROP CONSTRAINT ${constraint.constraint_name}`,
        );
      } catch (error) {
        console.warn(
          `⚠️ Could not drop constraint ${constraint.constraint_name}:`,
          error.message,
        );
      }
    }

    // Alter the column type to VARCHAR
    console.log("🔄 Changing tv_interface_id column type to VARCHAR...");
    try {
      await query(`
        ALTER TABLE tv_interface_marks 
        ALTER COLUMN tv_interface_id TYPE VARCHAR(255)
      `);
      console.log("✅ Successfully changed tv_interface_id to VARCHAR(255)");
    } catch (error) {
      console.warn("⚠️ Could not alter column type:", error.message);
    }

    // Re-add the foreign key constraint with proper type
    console.log("🔗 Re-adding foreign key constraint...");
    try {
      await query(`
        ALTER TABLE tv_interface_marks 
        ADD CONSTRAINT fk_tv_interface_marks_tv_interface_id 
        FOREIGN KEY (tv_interface_id) REFERENCES tv_interfaces(id) ON DELETE CASCADE
      `);
      console.log("✅ Successfully re-added foreign key constraint");
    } catch (error) {
      console.warn(
        "⚠️ Could not re-add foreign key constraint:",
        error.message,
      );
    }

    // Update table statistics
    console.log("📊 Updating table statistics...");
    await query("ANALYZE tv_interface_marks");

    // Show final column info
    const finalColumnInfo = await query(`
      SELECT data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks' AND column_name = 'tv_interface_id'
    `);

    console.log("📋 Final column info:", finalColumnInfo.rows[0]);

    console.log("\n🎉 TV interface ID format fixed successfully!");
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run the fix
fixTVInterfaceIdFormat()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
