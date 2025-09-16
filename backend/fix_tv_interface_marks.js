#!/usr/bin/env node

/**
 * Fix TV Interface Marks Table Structure
 *
 * This script fixes the missing columns in tv_interface_marks table
 */

import { query, testConnection } from "./src/utils/database.js";

async function fixTVInterfaceMarksTable() {
  console.log("🔧 Starting TV Interface Marks table fix...");

  try {
    // Test connection first
    console.log("📊 Testing database connection...");
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error("Database connection failed: " + connectionTest.error);
    }
    console.log("✅ Database connection successful");

    // Check current table structure
    console.log("🔍 Checking current table structure...");
    const currentColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks'
      ORDER BY ordinal_position
    `);

    console.log(
      "📋 Current columns:",
      currentColumns.rows.map((row) => row.column_name),
    );

    // Add missing columns
    const columnsToAdd = [
      {
        name: "mark_type",
        definition: `VARCHAR(50) NOT NULL DEFAULT 'point' CHECK (mark_type IN ('point', 'zone', 'area'))`,
      },
      {
        name: "step_id",
        definition: `VARCHAR(255) REFERENCES diagnostic_steps(id) ON DELETE CASCADE`,
      },
      {
        name: "shape",
        definition: `VARCHAR(50) NOT NULL DEFAULT 'circle' CHECK (shape IN ('circle', 'rectangle', 'polygon', 'ellipse'))`,
      },
      {
        name: "size",
        definition: `JSONB`,
      },
      {
        name: "coordinates",
        definition: `JSONB`,
      },
      {
        name: "background_color",
        definition: `VARCHAR(50)`,
      },
      {
        name: "is_clickable",
        definition: `BOOLEAN DEFAULT true`,
      },
      {
        name: "is_highlightable",
        definition: `BOOLEAN DEFAULT true`,
      },
      {
        name: "click_action",
        definition: `VARCHAR(255)`,
      },
      {
        name: "hover_action",
        definition: `VARCHAR(255)`,
      },
      {
        name: "action_value",
        definition: `VARCHAR(255)`,
      },
      {
        name: "action_description",
        definition: `TEXT`,
      },
      {
        name: "expected_result",
        definition: `TEXT`,
      },
      {
        name: "hint_text",
        definition: `TEXT`,
      },
      {
        name: "tooltip_text",
        definition: `TEXT`,
      },
      {
        name: "warning_text",
        definition: `TEXT`,
      },
      {
        name: "animation",
        definition: `VARCHAR(50) DEFAULT 'none' CHECK (animation IN ('pulse', 'glow', 'bounce', 'shake', 'fade', 'blink', 'none'))`,
      },
      {
        name: "animation_duration",
        definition: `INTEGER DEFAULT 1000`,
      },
      {
        name: "animation_delay",
        definition: `INTEGER DEFAULT 0`,
      },
      {
        name: "display_order",
        definition: `INTEGER DEFAULT 0`,
      },
      {
        name: "priority",
        definition: `VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical'))`,
      },
    ];

    const existingColumnNames = currentColumns.rows.map(
      (row) => row.column_name,
    );

    for (const column of columnsToAdd) {
      if (!existingColumnNames.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        try {
          await query(
            `ALTER TABLE tv_interface_marks ADD COLUMN ${column.name} ${column.definition}`,
          );
          console.log(`✅ Added column: ${column.name}`);
        } catch (error) {
          console.warn(
            `⚠️ Could not add column ${column.name}:`,
            error.message,
          );
        }
      } else {
        console.log(`ℹ️ Column ${column.name} already exists`);
      }
    }

    // Update table statistics
    console.log("📊 Updating table statistics...");
    await query("ANALYZE tv_interface_marks");

    // Show final table structure
    console.log("📋 Getting final table structure...");
    const finalColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks'
      ORDER BY ordinal_position
    `);

    console.log("\n📊 Final table structure:");
    finalColumns.rows.forEach((column) => {
      console.log(
        `  ${column.column_name}: ${column.data_type}${column.is_nullable === "NO" ? " NOT NULL" : ""}${column.column_default ? " DEFAULT " + column.column_default : ""}`,
      );
    });

    console.log("\n🎉 TV Interface Marks table structure fixed successfully!");
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run the fix
fixTVInterfaceMarksTable()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
