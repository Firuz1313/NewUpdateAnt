import { query } from "../utils/database.js";

// Исправить формат tv_interface_id в таблице tv_interface_marks
export const fixTVInterfaceIdFormat = async (req, res) => {
  try {
    console.log("🔧 Starting TV interface ID format fix...");

    // Check current table structure
    console.log("🔍 Checking current tv_interface_id column...");
    const columnInfo = await query(`
      SELECT data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks' AND column_name = 'tv_interface_id'
    `);

    if (columnInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "tv_interface_id column not found",
        timestamp: new Date().toISOString(),
      });
    }

    const currentType = columnInfo.rows[0].data_type;
    console.log("📋 Current column type:", currentType);

    // Check if there are any existing records
    const recordCount = await query(
      "SELECT COUNT(*) as count FROM tv_interface_marks",
    );
    console.log(`📊 Current records in table: ${recordCount.rows[0].count}`);

    let operationsPerformed = [];

    // Only proceed if the column is not already VARCHAR
    if (currentType !== "character varying") {
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
          operationsPerformed.push(
            `Dropped constraint: ${constraint.constraint_name}`,
          );
        } catch (error) {
          console.warn(
            `⚠️ Could not drop constraint ${constraint.constraint_name}:`,
            error.message,
          );
          operationsPerformed.push(
            `Failed to drop constraint: ${constraint.constraint_name} - ${error.message}`,
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
        operationsPerformed.push(
          "Changed tv_interface_id column type to VARCHAR(255)",
        );
      } catch (error) {
        console.warn("⚠️ Could not alter column type:", error.message);
        operationsPerformed.push(
          `Failed to alter column type: ${error.message}`,
        );
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
        operationsPerformed.push("Re-added foreign key constraint");
      } catch (error) {
        console.warn(
          "⚠️ Could not re-add foreign key constraint:",
          error.message,
        );
        operationsPerformed.push(
          `Failed to re-add foreign key constraint: ${error.message}`,
        );
      }

      // Update table statistics
      console.log("📊 Updating table statistics...");
      await query("ANALYZE tv_interface_marks");
      operationsPerformed.push("Updated table statistics");
    } else {
      operationsPerformed.push("Column already has correct type (VARCHAR)");
    }

    // Show final column info
    const finalColumnInfo = await query(`
      SELECT data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tv_interface_marks' AND column_name = 'tv_interface_id'
    `);

    res.json({
      success: true,
      data: {
        initialColumnInfo: columnInfo.rows[0],
        finalColumnInfo: finalColumnInfo.rows[0],
        recordCount: parseInt(recordCount.rows[0].count),
        operationsPerformed,
      },
      message: "TV interface ID format fix completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ TV interface ID format fix failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix TV interface ID format",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default {
  fixTVInterfaceIdFormat,
};
